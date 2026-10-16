// client/src/features/quran/api/quranApi.js
import { SURAH_LIST, LOCAL_PRESET_AYAT } from "../../../data/quranData.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Fetches a random verse via the backend proxy (which handles multi-provider fallback and eliminates CORS).
 */
export const fetchRandomVerse = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/quran/random-verse`);

    if (response.ok) {
      const json = await response.json();
      if (json.code === 200 && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn("Backend Quran proxy /random-verse unavailable, trying direct ayah proxy...", err.message);
  }

  // Fallback to proxying a random ID
  const randomVerseId = Math.floor(Math.random() * 6236) + 1;
  try {
    const response = await fetch(
      `${API_BASE}/api/quran/ayah/${randomVerseId}/editions/quran-uthmani,en.sahih,ar.alafasy`,
    );

    if (response.ok) {
      const json = await response.json();
      if (json.code === 200 && json.data && json.data.length >= 2) {
        const uthmani = json.data[0];
        const translation = json.data[1];
        const audio = json.data[2];

        const surahInfo = SURAH_LIST.find(
          (s) => s.no === uthmani.surah.number,
        ) || {
          no: uthmani.surah.number,
          name: uthmani.surah.englishName,
          arabic: uthmani.surah.name,
          ayahs: uthmani.surah.numberOfAyahs,
        };

        return {
          globalId: uthmani.number,
          surahNo: uthmani.surah.number,
          surahName: surahInfo.name,
          surahNameArabic: uthmani.surah.name,
          ayahNo: uthmani.numberInSurah,
          totalAyahsInSurah: uthmani.surah.numberOfAyahs,
          arabic: uthmani.text,
          eng: translation.text,
          translation: translation.text,
          juz: uthmani.juz,
          audioUrl:
            audio?.audio ||
            `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${uthmani.surah.number}/${uthmani.numberInSurah}.mp3`,
        };
      }
    }
  } catch (error) {
    console.warn("Quran proxy request failed, using local verified preset deck:", error.message);
  }

  // Guaranteed offline / preset deck fallback
  return LOCAL_PRESET_AYAT[
    Math.floor(Math.random() * LOCAL_PRESET_AYAT.length)
  ];
};

/**
 * Enriches a verse object with missing translations or audio editions from our proxy.
 */
export const enrichAyahEditions = async (ayahData) => {
  const sNo = ayahData.surahNo || ayahData.surahNumber;
  const aNo = ayahData.ayahNo || ayahData.ayatNumber;
  if (!sNo || !aNo) return ayahData;

  const needsArabic = !ayahData.arabic;
  const needsEng = !ayahData.eng && !ayahData.translation;
  const needsUrdu = !ayahData.urdu && !ayahData.translationUrdu;
  const needsHindi = !ayahData.hindi && !ayahData.translationHindi;
  const needsAudio = !ayahData.audioUrl;

  if (!needsArabic && !needsEng && !needsUrdu && !needsHindi && !needsAudio) {
    return ayahData;
  }

  const updated = { ...ayahData };

  try {
    const editionsList = [];
    if (needsArabic) editionsList.push("quran-uthmani");
    if (needsEng) editionsList.push("en.sahih");
    if (needsUrdu) editionsList.push("ur.jalandhry");
    if (needsHindi) editionsList.push("hi.hindi");
    editionsList.push("ar.alafasy");

    const response = await fetch(
      `${API_BASE}/api/quran/ayah/${sNo}:${aNo}/editions/${editionsList.join(",")}`,
    );

    if (response.ok) {
      const json = await response.json();

      if (json.code === 200 && Array.isArray(json.data)) {
        json.data.forEach((item) => {
          if (item.edition?.identifier === "quran-uthmani" && !updated.arabic) {
            updated.arabic = item.text;
          }
          if (item.edition?.identifier === "en.sahih") {
            if (!updated.eng) updated.eng = item.text;
            if (!updated.translation) updated.translation = item.text;
            if (!updated.english_translation) updated.english_translation = item.text;
          }
          if (item.edition?.identifier === "ur.jalandhry") {
            if (!updated.urdu) updated.urdu = item.text;
            if (!updated.translationUrdu) updated.translationUrdu = item.text;
            if (!updated.urdu_translation) updated.urdu_translation = item.text;
          }
          if (item.edition?.identifier === "hi.hindi") {
            if (!updated.hindi) updated.hindi = item.text;
            if (!updated.translationHindi) updated.translationHindi = item.text;
            if (!updated.hindi_translation) updated.hindi_translation = item.text;
          }
          if (item.edition?.format === "audio" && !updated.audioUrl) {
            updated.audioUrl = item.audio;
          }
        });
      }
    }

    if (!updated.audioUrl) {
      updated.audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${sNo}/${aNo}.mp3`;
    }
  } catch (err) {
    console.warn("Proxy edition fetch error (using fallback audio):", err.message);
    if (!updated.audioUrl) {
      updated.audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${sNo}/${aNo}.mp3`;
    }
  }

  return updated;
};
