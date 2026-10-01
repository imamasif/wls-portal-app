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
        translation: translation.text,
        juz: uthmani.juz,
        audioUrl:
          audio?.audio ||
          `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${uthmani.number}.mp3`,
      };
    }
    throw new Error("Invalid Quran API response payload");
  } catch (error) {
    console.error("Failed to fetch from Quran Cloud API:", error);
    // Fallback to local preset array if network fails
    return LOCAL_PRESET_AYAT[
      Math.floor(Math.random() * LOCAL_PRESET_AYAT.length)
    ];
  }
};
