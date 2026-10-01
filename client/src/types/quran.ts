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

export type QuizStatus = "correct" | "wrong" | null;
