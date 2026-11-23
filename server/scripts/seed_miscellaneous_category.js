import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/wls-portal-db";

async function seedMiscellaneousCategory() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log("Connected successfully!");

  const categoriesCol = mongoose.connection.db.collection("categories");
  const lecturesCol = mongoose.connection.db.collection("lectures");

  // 1. Check if "Miscellaneous" category exists
  let category = await categoriesCol.findOne({
    $or: [
      { category_name: "Miscellaneous", language: "eng" },
      { category_id: 13, language: "eng" },
    ],
  });

  const categoryDoc = {
    source: "IIPC Canada",
    compiler: "Muhammad Shaikh",
    category_id: 13,
    category_name: "Miscellaneous",
    language: "eng",
    total_lectures: 1,
    tags: ["Miscellaneous", "Online TV", "Live Broadcast"],
    icon_url: [
      "http://www.muhammadshaikh.com/roku/IIPCTV_CHANNEL/ENGLISH/IMAGES/ENG_URDU_TV/SATELLITE.png",
    ],
    updatedAt: new Date(),
  };

  if (!category) {
    categoryDoc._id = new mongoose.Types.ObjectId().toString();
    categoryDoc.createdAt = new Date();
    await categoriesCol.insertOne(categoryDoc);
    category = categoryDoc;
    console.log(`Inserted new Category "Miscellaneous" with _id: ${category._id}`);
  } else {
    await categoriesCol.updateOne(
      { _id: category._id },
      { $set: categoryDoc }
    );
    console.log(`Updated existing Category "Miscellaneous" (_id: ${category._id})`);
  }

  // 2. Insert or update the "IIPC English TV Channel" item
  const categoryIdRef = String(category._id);
  const videoStreamUrl = "https://uni10rtmp.tulix.tv/iipctv/iipctv.smil/playlist.m3u8";
  const channelImageUrl = "http://www.muhammadshaikh.com/roku/IIPCTV_CHANNEL/ENGLISH/IMAGES/ENG_URDU_TV/SATELLITE.png";
  const channelDescription = "With the IIPC TV English channel, you can watch the most popular broadcasts of the day, browse live broadcasts by the Book of GOD you love and follow your favorite IIPC TV broadcasters.";

  const episodeItem = {
    id: "online_tv_iipc_english",
    episode_number: "Live Stream",
    episode_title: "IIPC English TV Channel",
    title: "IIPC English TV Channel",
    episode_url: videoStreamUrl,
    videoUrl: videoStreamUrl,
    description: channelDescription,
    image: channelImageUrl,
    fgImage: channelImageUrl,
    bgImage: channelImageUrl,
    tags: ["Online TV", "Live Broadcast"],
  };

  const lectureDoc = {
    category_id_ref: categoryIdRef,
    lecture_id: 1,
    lecture_name: ["IIPC English TV Channel"],
    language: "eng",
    year_delivered: "Live Broadcast",
    season: "ONLINE TV CHANNELS",
    episode: "Live",
    video_url: videoStreamUrl,
    video_urls: [videoStreamUrl],
    full_lecture_video_url: videoStreamUrl,
    youtube_urls: [],
    facebook_urls: [],
    description: channelDescription,
    seasons: [
      {
        season_name: "ONLINE TV CHANNELS",
        episodes: [episodeItem],
        tags: ["Online TV"],
      },
    ],
    episodes: [episodeItem],
    icon_url: [channelImageUrl],
    total_ayats: 0,
    pdf_booklet_urls: [],
    pdf_link: "",
    pdf_url: [],
    tags: ["Online TV", "Live Broadcast"],
    updatedAt: new Date(),
  };

  const existingLecture = await lecturesCol.findOne({
    $or: [
      { category_id_ref: category._id, lecture_name: "IIPC English TV Channel" },
      { category_id_ref: categoryIdRef, lecture_name: "IIPC English TV Channel" },
      { category_id_ref: category._id, lecture_id: 1 },
      { category_id_ref: categoryIdRef, lecture_id: 1 },
    ],
  });

  if (!existingLecture) {
    lectureDoc._id = new mongoose.Types.ObjectId().toString();
    lectureDoc.createdAt = new Date();
    await lecturesCol.insertOne(lectureDoc);
    console.log(`Inserted Lecture "IIPC English TV Channel" with _id: ${lectureDoc._id}`);
  } else {
    await lecturesCol.updateOne(
      { _id: existingLecture._id },
      { $set: lectureDoc }
    );
    console.log(`Updated Lecture "IIPC English TV Channel" (_id: ${existingLecture._id})`);
  }

  // Count total lectures for category
  const count = await lecturesCol.countDocuments({
    $or: [{ category_id_ref: category._id }, { category_id_ref: categoryIdRef }],
  });
  await categoriesCol.updateOne({ _id: category._id }, { $set: { total_lectures: count } });
  console.log(`Category "Miscellaneous" total_lectures updated to ${count}`);

  await mongoose.disconnect();
  console.log("Database updated successfully and disconnected.");
}

seedMiscellaneousCategory().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
