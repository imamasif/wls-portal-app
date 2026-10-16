// server/src/features/quran/quran.controller.js
import express from "express";

const router = express.Router();

// 114 Surah lengths to map global ayah ID (1 - 6236) to { surah, ayah }
const SURAH_LENGTHS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

const SURAH_NAMES = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am",
  "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim",
  "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Taha", "Al-Anbiya", "Al-Hajj",
  "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas",
  "Al-'Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir", "Ya-Sin",
  "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shura", "Az-Zukhruf",
  "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid",
  "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun",
  "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan",
  "Al-Mursalat", "An-Naba", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar",
  "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah",
  "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duhaa", "Ash-Sharh", "At-Tin",
  "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah",
  "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar",
  "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

function convertGlobalIdToSurahAyah(globalId) {
  let rem = Number(globalId);
  if (isNaN(rem) || rem < 1) rem = 1;
  if (rem > 6236) rem = 6236;

  for (let i = 0; i < SURAH_LENGTHS.length; i++) {
    if (rem <= SURAH_LENGTHS[i]) {
      return { surah: i + 1, ayah: rem };
    }
    rem -= SURAH_LENGTHS[i];
  }
  return { surah: 1, ayah: 1 };
}

function getGlobalIdFromSurahAyah(surah, ayah) {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) {
    count += SURAH_LENGTHS[i];
  }
  return count + Number(ayah);
}

// In-memory cache for fast lookups and resilience
const ayahCache = new Map();

/**
 * Fetch from api.quran.com as reliable fallback
 */
async function fetchFromQuranCom(surah, ayah) {
  const verseKey = `${surah}:${ayah}`;
  const [uthmaniRes, transRes] = await Promise.all([
    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${verseKey}`).then(r => r.json()),
    fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=en&words=false&translations=20,97,122`).then(r => r.json())
  ]);

  const arabicText = uthmaniRes.verses?.[0]?.text_uthmani || "";
  const translations = transRes.verse?.translations || [];

  const enTrans = translations.find(t => t.resource_id === 20)?.text?.replace(/<[^>]*>/g, "") || "";
  const urTrans = translations.find(t => t.resource_id === 97)?.text?.replace(/<[^>]*>/g, "") || "";
  const hiTrans = translations.find(t => t.resource_id === 122)?.text?.replace(/<[^>]*>/g, "") || "";
  const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surah}/${ayah}.mp3`;

  return {
    arabic: arabicText,
    eng: enTrans,
    urdu: urTrans,
    hindi: hiTrans,
    audioUrl,
    juz: transRes.verse?.juz_number || 1
  };
}

/**
 * Unified Ayah Fetcher:
 * 1. Checks memory cache
 * 2. Tries api.alquran.cloud (with timeout)
 * 3. Falls back to api.quran.com
 */
async function getAyahData(ref, editionsStr = "") {
  let surah = 1;
  let ayah = 1;
  let globalId = 1;

  if (String(ref).includes(":")) {
    const parts = String(ref).split(":");
    surah = parseInt(parts[0], 10);
    ayah = parseInt(parts[1], 10);
    globalId = getGlobalIdFromSurahAyah(surah, ayah);
  } else {
    globalId = parseInt(ref, 10);
    const converted = convertGlobalIdToSurahAyah(globalId);
    surah = converted.surah;
    ayah = converted.ayah;
  }

  const cacheKey = `${surah}:${ayah}:${editionsStr}`;
  if (ayahCache.has(cacheKey)) {
    return ayahCache.get(cacheKey);
  }

  // Attempt 1: Fetch from api.alquran.cloud with 3-second timeout
  let alquranData = null;
  try {
    const editions = editionsStr || "quran-uthmani,en.sahih,ur.jalandhry,hi.hindi,ar.alafasy";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/${editions}`, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WLS-Portal" }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && Array.isArray(json.data) && json.data.length > 0) {
        alquranData = json;
      }
    }
  } catch (err) {
    // AlQuran cloud failed or timed out (e.g. 503 balancer error)
  }

  if (alquranData) {
    ayahCache.set(cacheKey, alquranData);
    return alquranData;
  }

  // Attempt 2: Fallback to rock-solid api.quran.com
  try {
    const quranComData = await fetchFromQuranCom(surah, ayah);
    const surahName = SURAH_NAMES[surah - 1] || "Surah";

    const formattedData = [
      {
        number: globalId,
        text: quranComData.arabic,
        numberInSurah: ayah,
        juz: quranComData.juz,
        surah: { number: surah, name: surahName, englishName: surahName, numberOfAyahs: SURAH_LENGTHS[surah - 1] },
        edition: { identifier: "quran-uthmani", language: "ar", name: "Uthmani", format: "text" }
      },
      {
        number: globalId,
        text: quranComData.eng,
        numberInSurah: ayah,
        juz: quranComData.juz,
        surah: { number: surah, name: surahName, englishName: surahName, numberOfAyahs: SURAH_LENGTHS[surah - 1] },
        edition: { identifier: "en.sahih", language: "en", name: "Saheeh International", format: "text" }
      },
      {
        number: globalId,
        text: quranComData.urdu,
        numberInSurah: ayah,
        juz: quranComData.juz,
        surah: { number: surah, name: surahName, englishName: surahName, numberOfAyahs: SURAH_LENGTHS[surah - 1] },
        edition: { identifier: "ur.jalandhry", language: "ur", name: "Fateh Muhammad Jalandhry", format: "text" }
      },
      {
        number: globalId,
        text: quranComData.hindi,
        numberInSurah: ayah,
        juz: quranComData.juz,
        surah: { number: surah, name: surahName, englishName: surahName, numberOfAyahs: SURAH_LENGTHS[surah - 1] },
        edition: { identifier: "hi.hindi", language: "hi", name: "Hindi Translation", format: "text" }
      },
      {
        number: globalId,
        text: "",
        audio: quranComData.audioUrl,
        numberInSurah: ayah,
        juz: quranComData.juz,
        surah: { number: surah, name: surahName, englishName: surahName, numberOfAyahs: SURAH_LENGTHS[surah - 1] },
        edition: { identifier: "ar.alafasy", language: "ar", name: "Alafasy", format: "audio" }
      }
    ];

    const result = { code: 200, status: "OK", data: formattedData };
    ayahCache.set(cacheKey, result);
    return result;
  } catch (fallbackErr) {
    console.error("All Quran providers failed for ref", ref, fallbackErr.message);
    throw new Error(`Unable to load verse data for ${ref}`);
  }
}

/**
 * Route: GET /api/quran/random-verse
 * Direct helper returning a full currentAyah object
 */
router.get("/random-verse", async (req, res) => {
  try {
    const randomGlobalId = Math.floor(Math.random() * 6236) + 1;
    const { surah, ayah } = convertGlobalIdToSurahAyah(randomGlobalId);
    const json = await getAyahData(`${surah}:${ayah}`);

    const uthmani = json.data?.find(d => d.edition?.identifier === "quran-uthmani") || json.data?.[0];
    const en = json.data?.find(d => d.edition?.identifier === "en.sahih") || json.data?.[1];
    const ur = json.data?.find(d => d.edition?.identifier === "ur.jalandhry");
    const hi = json.data?.find(d => d.edition?.identifier === "hi.hindi");
    const audio = json.data?.find(d => d.edition?.format === "audio") || json.data?.[4];

    const surahName = SURAH_NAMES[surah - 1] || uthmani?.surah?.englishName || "Surah";

    res.json({
      code: 200,
      status: "OK",
      data: {
        globalId: randomGlobalId,
        surahNo: surah,
        surahName: surahName,
        surahNameArabic: uthmani?.surah?.name || "",
        ayahNo: ayah,
        totalAyahsInSurah: SURAH_LENGTHS[surah - 1],
        arabic: uthmani?.text || "",
        eng: en?.text || "",
        translation: en?.text || "",
        translationUrdu: ur?.text || "",
        translationHindi: hi?.text || "",
        juz: uthmani?.juz || 1,
        audioUrl: audio?.audio || `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surah}/${ayah}.mp3`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Route: GET /api/quran/ayah/:ref
 * Route: GET /api/quran/ayah/:ref/editions/:editions
 * Mirroring the Al-Quran Cloud REST format so clients can drop-in replace
 */
router.get(["/ayah/:ref", "/ayah/:ref/editions/:editions"], async (req, res) => {
  try {
    const { ref } = req.params;
    const editions = req.params.editions || req.query.editions || "";
    const result = await getAyahData(ref, editions);
    res.json(result);
  } catch (err) {
    res.status(500).json({ code: 500, status: "ERROR", error: err.message });
  }
});

export default router;
