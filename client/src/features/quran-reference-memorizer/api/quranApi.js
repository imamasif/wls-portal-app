// client/src/features/quran/api/quranApi.js
import { SURAH_LIST, LOCAL_PRESET_AYAT } from "../../../data/quranData.jsx";

/**
 * Fetches a random verse from api.alquran.cloud out of all 6,236 verses.
 */
export const fetchRandomVerse = async () => {
  const randomVerseId = Math.floor(Math.random() * 6236) + 1;

  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/ayah/${randomVerseId}/editions/quran-uthmani,en.sahih,ar.alafasy`,
    );

    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }

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
        juz: uthmani.juz,
        audioUrl:
          audio?.audio ||
          `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${uthmani.surah.number}/${uthmani.numberInSurah}.mp3`,
      };
    }
    throw new Error("Invalid Quran API response payload");
  } catch (error) {
    console.error("Failed to fetch from Quran Cloud API:", error);
    return LOCAL_PRESET_AYAT[
      Math.floor(Math.random() * LOCAL_PRESET_AYAT.length)
    ];
  }
};

/**
 * Enriches a verse object with missing translations or audio editions from Al-Quran Cloud.
 */
export const enrichAyahEditions = async (ayahData) => {
  const sNo = ayahData.surahNo || ayahData.surahNumber;
  const aNo = ayahData.ayahNo || ayahData.ayatNumber;
  if (!sNo || !aNo) return ayahData;

  const needsArabic = !ayahData.arabic;
  const needsEng = !ayahData.eng;
  const needsUrdu = !ayahData.urdu;
  const needsHindi = !ayahData.hindi;
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
      `https://api.alquran.cloud/v1/ayah/${sNo}:${aNo}/editions/${editionsList.join(",")}`,
    );
    const json = await response.json();

    if (json.code === 200 && Array.isArray(json.data)) {
      json.data.forEach((item) => {
        if (item.edition.identifier === "quran-uthmani" && !updated.arabic) {
          updated.arabic = item.text;
        }
        if (item.edition.identifier === "en.sahih" && !updated.eng) {
          updated.eng = item.text;
        }
        if (item.edition.identifier === "ur.jalandhry" && !updated.urdu) {
          updated.urdu = item.text;
        }
        if (item.edition.identifier === "hi.hindi" && !updated.hindi) {
          updated.hindi = item.text;
        }
        if (item.edition.format === "audio" && !updated.audioUrl) {
          updated.audioUrl = item.audio;
        }
      });
    }

    if (!updated.audioUrl) {
      updated.audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${sNo}/${aNo}.mp3`;
    }
  } catch (err) {
    console.error("Error fetching missing verse editions from API:", err);
  }

  return updated;
};
