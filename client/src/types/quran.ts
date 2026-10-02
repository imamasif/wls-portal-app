export interface Surah {
  no: number;
  name: string;
  arabic: string;
  ayahs: number;
}

export interface Ayah {
  globalId: number;
  surahNo: number;
  surahName: string;
  surahNameArabic: string;
  ayahNo: number;
  totalAyahsInSurah: number;
  arabic: string;
  translation: string;
  juz?: number;
  audioUrl?: string;
}

export interface Derivative {
  id: string;
  wordArabic: string;
  transliteration: string;
  translation: string;
  gender: "M" | "F";
  number: "S" | "D" | "P";
  pos: "Noun" | "Verb" | "Active Participle" | "Passive Participle";
}

export interface RootData {
  rootArabic: string; // e.g., "أ - م - ن"
  rootEnglish: string; // e.g., "A-M-N"
  meaning: string; // e.g., "Safety, Faith, Trust"
  occurrences: number; // e.g., 879
  lemma: string; // e.g., "آمَنَ" (Trunk Verb)
  branches: Derivative[]; // Derived leaves (Masculine, Feminine, Singular, Dual, Plural)
}

export type QuizStatus = "correct" | "wrong" | null;
