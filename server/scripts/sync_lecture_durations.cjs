const mongoose = require('mongoose');
const https = require('https');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wls-portal-db';

function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

function fetchYoutubeDuration(videoId) {
  return new Promise((resolve) => {
    const url = 'https://www.youtube.com/watch?v=' + videoId;
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 6000,
      },
      (res) => {
        let html = '';
        res.on('data', (chunk) => (html += chunk));
        res.on('end', () => {
          const matchSec = html.match(/"lengthSeconds":"(\d+)"/);
          if (matchSec) {
            return resolve(parseInt(matchSec[1], 10));
          }
          const matchMs = html.match(/"approxDurationMs":"(\d+)"/);
          if (matchMs) {
            return resolve(Math.round(parseInt(matchMs[1], 10) / 1000));
          }
          resolve(null);
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

async function syncDurations() {
  console.log('Connecting to MongoDB at:', mongoUri);
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const lectures = await db.collection('universitylectures').find({}).toArray();
  console.log(`Found ${lectures.length} total lecture(s) in universitylectures collection.`);

  // Group by unique YouTube videoId
  const idMap = new Map(); // videoId -> [lectureIds]
  for (const lec of lectures) {
    const rawUrl = lec.videoUrls && lec.videoUrls[0];
    const ytId = extractYoutubeId(rawUrl);
    if (ytId) {
      if (!idMap.has(ytId)) idMap.set(ytId, []);
      idMap.get(ytId).push(lec._id);
    }
  }

  const uniqueVideoIds = Array.from(idMap.keys());
  console.log(`Identified ${uniqueVideoIds.length} unique YouTube video ID(s) across all lectures.`);

  const durationCache = new Map(); // ytId -> durationSeconds
  let processed = 0;
  let successCount = 0;

  // Process with concurrency of 5
  const CONCURRENCY = 6;
  for (let i = 0; i < uniqueVideoIds.length; i += CONCURRENCY) {
    const chunk = uniqueVideoIds.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (ytId) => {
        const sec = await fetchYoutubeDuration(ytId);
        if (sec && sec > 0) {
          durationCache.set(ytId, sec);
          successCount++;
        }
        processed++;
      })
    );
    if (processed % 20 === 0 || processed === uniqueVideoIds.length) {
      console.log(`  Progress: ${processed}/${uniqueVideoIds.length} checked (${successCount} durations retrieved)...`);
    }
  }

  console.log(`\nFinished fetching YouTube durations. Retrieved actual length for ${successCount}/${uniqueVideoIds.length} videos.`);

  // Update lectures in MongoDB
  let updatedCount = 0;
  for (const [ytId, sec] of durationCache.entries()) {
    const lectureIds = idMap.get(ytId);
    if (lectureIds && lectureIds.length > 0) {
      const res = await db.collection('universitylectures').updateMany(
        { _id: { $in: lectureIds } },
        { $set: { durationSeconds: sec } }
      );
      updatedCount += res.modifiedCount;
    }
  }

  console.log(`Successfully updated ${updatedCount} lecture document(s) in MongoDB with their exact YouTube duration!`);

  // Print a sample of updated lectures
  const sample = await db.collection('universitylectures').find({ durationSeconds: { $gt: 0 } }).limit(5).toArray();
  console.log('\nSample Updated Lectures:');
  sample.forEach((l) => {
    const m = Math.floor(l.durationSeconds / 60);
    const s = l.durationSeconds % 60;
    console.log(`- [${l.order}] ${l.title} -> ${l.durationSeconds}s (${m}m ${s}s)`);
  });

  await mongoose.disconnect();
}

syncDurations().catch((err) => {
  console.error('Error syncing durations:', err);
  process.exit(1);
});
