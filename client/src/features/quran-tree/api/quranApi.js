import axios from "axios";

const QURAN_BASE_URL = "https://api.quran.com/api/v4";

const mapPosTag = (posKey, text, translation) => {
  const key = (posKey || "").toUpperCase();
  const trans = (translation || "").toLowerCase();

  if (key === "V" || key.includes("VERB")) return "Verb";
  if (key === "P" || key === "PREP" || key.includes("PREP"))
    return "Preposition";
  if (key === "PRON" || key.includes("PRON")) return "Pronoun";
  if (key === "CONJ" || key.includes("CONJ")) return "Conjunction";
  if (key === "ACC" || key === "T" || key === "AMD" || key === "ANS")
    return "Particle";

  if (
    trans.startsWith("we ") ||
    trans.startsWith("he ") ||
    trans.startsWith("they ") ||
    trans.includes("hurl") ||
    trans.includes("breaks") ||
    trans.includes("sent") ||
    trans.includes("revealed")
  ) {
    return "Verb";
  }
  if (
    ["against", "upon", "on", "in", "from", "to", "with", "before"].some((p) =>
      trans.startsWith(p),
    ) ||
    ["عَلَىٰ", "فِي", "مِنْ", "قَبْلَ"].includes(text)
  ) {
    return "Preposition";
  }
  if (
    ["nay", "behold", "and when", "if", "indeed", "except", "not"].some((p) =>
      trans.includes(p),
    ) ||
    ["بَلْ", "فَإِذَا", "إِذْ", "إِلَّا", "لَا", "إِن"].includes(text)
  ) {
    return "Particle";
  }
  if (
    ["he", "it", "they", "you", "we"].includes(trans.trim()) ||
    ["هُوَ", "هُمْ", "أَنْتُمْ", "كُنْتُمْ"].includes(text)
  ) {
    return "Pronoun";
  }

  return "Noun";
};

export const fetchVerseMorphology = async (chapter = 21, verse = 7) => {
  try {
    const response = await axios.get(
      `${QURAN_BASE_URL}/verses/by_key/${chapter}:${verse}`,
      {
        params: {
          words: true,
          fields: "text_uthmani",
          word_fields: "text_uthmani,location,code_v1,part_of_speech_key",
        },
      },
    );

    const verseData = response.data?.verse;
    const words = (verseData?.words || []).filter(
      (w) => w.char_type_name === "word",
    );

    const branches = words.map((word, index) => {
      const text = word.text_uthmani || word.text || "";
      const translationText = word.translation?.text || "";
      const pos = mapPosTag(
        word.part_of_speech_key || word.class_name,
        text,
        translationText,
      );

      const isFeminine = text.includes("ة") || text.endsWith("ت");
      const isPlural =
        text.endsWith("ونَ") ||
        text.endsWith("ِينَ") ||
        text.endsWith("ات") ||
        text.endsWith("وا");

      return {
        id: word.id || `word-${index}`,
        wordArabic: text,
        transliteration: word.transliteration?.text || "",
        translation: translationText,
        pos: pos,
        gender: isFeminine ? "F" : "M",
        number: isPlural ? "P" : "S",
      };
    });

    // Extract full verse text from API or join all words
    const fullVerseText =
      verseData?.text_uthmani ||
      words.map((w) => w.text_uthmani || w.text).join(" ");

    return {
      fullVerseArabic: fullVerseText,
      meaning: `Surah ${chapter}:${verse}`,
      totalWords: branches.length,
      branches,
    };
  } catch (error) {
    console.error("Error fetching Quranic morphology:", error);
    throw error;
  }
};
