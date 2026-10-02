import axios from "axios";

const QURAN_BASE_URL = "https://api.quran.com/api/v4";

/**
 * Fetch verse words from Quran.com and set QuranHub word image URLs dynamically
 */
export const fetchVerseDictionaryData = async (chapter = 21, verse = 18) => {
  try {
    const response = await axios.get(
      `${QURAN_BASE_URL}/verses/by_key/${chapter}:${verse}`,
      {
        params: {
          words: true,
          word_fields:
            "text_uthmani,location,code_v1,part_of_speech_key,root_one_level",
          translations: "131", // Dr. Mustafa Khattab
          fields: "text_uthmani",
        },
      },
    );

    const verseData = response.data?.verse;
    const words = (verseData?.words || []).filter(
      (w) => w.char_type_name === "word",
    );

    return {
      chapter,
      verse,
      verseKey: `${chapter}:${verse}`,
      fullVerseArabic: verseData?.text_uthmani || "",
      words: words.map((w, index) => {
        const location = w.location || `${chapter}:${verse}:${index + 1}`;

        // Dynamically request word-by-word image from QuranHub API
        const imageUrl = `https://api.quranhub.com/v1/word-image?location=${location}&type=v4`;

        return {
          id: w.id || `word-${index}`,
          position: index + 1,
          arabicText: w.text_uthmani || w.text,
          transliteration: w.transliteration?.text || "",
          translationKhattab: w.translation?.text || "",
          root: w.root_one_level || null,
          location: location,
          imageUrl: imageUrl,
        };
      }),
    };
  } catch (error) {
    console.error("Error fetching verse dictionary data:", error);
    throw error;
  }
};

export const fetchRootOccurrences = async (rootQuery) => {
  if (!rootQuery) return [];
  try {
    const response = await axios.get(`${QURAN_BASE_URL}/search`, {
      params: {
        q: rootQuery,
        size: 6,
      },
    });

    return (response.data?.search?.results || []).map((res) => ({
      key: res.verse_key,
      text: res.text,
      translations: res.translations?.[0]?.text || "",
    }));
  } catch (error) {
    console.error("Error fetching root occurrences:", error);
    return [];
  }
};
