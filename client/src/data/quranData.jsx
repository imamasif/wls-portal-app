import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen,
  Globe,
  Trophy,
  Flame,
  BarChart2,
  Loader2,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Check,
  X,
  CheckCircle2,
  ChevronRight,
  Bookmark,
  RefreshCw,
} from "lucide-react";

export const SURAH_LIST = [
  { no: 1, name: "Al-Fatihah", arabic: "الفاتحة", ayahs: 7 },
  { no: 2, name: "Al-Baqarah", arabic: "البقرة", ayahs: 286 },
  { no: 3, name: "Ali 'Imran", arabic: "آل عمران", ayahs: 200 },
  { no: 4, name: "An-Nisa", arabic: "النساء", ayahs: 176 },
  { no: 5, name: "Al-Ma'idah", arabic: "المائدة", ayahs: 120 },
  { no: 6, name: "Al-An'am", arabic: "الأنعام", ayahs: 165 },
  { no: 7, name: "Al-A'raf", arabic: "الأعراف", ayahs: 206 },
  { no: 8, name: "Al-Anfal", arabic: "الأنفال", ayahs: 75 },
  { no: 9, name: "At-Tawbah", arabic: "التوبة", ayahs: 129 },
  { no: 10, name: "Yunus", arabic: "يونس", ayahs: 109 },
  { no: 11, name: "Hud", arabic: "هود", ayahs: 123 },
  { no: 12, name: "Yusuf", arabic: "يوسف", ayahs: 111 },
  { no: 13, name: "Ar-Ra'd", arabic: "الرعد", ayahs: 43 },
  { no: 14, name: "Ibrahim", arabic: "ابراهيم", ayahs: 52 },
  { no: 15, name: "Al-Hijr", arabic: "الحجر", ayahs: 99 },
  { no: 16, name: "An-Nahl", arabic: "النحل", ayahs: 128 },
  { no: 17, name: "Al-Isra", arabic: "الإسراء", ayahs: 111 },
  { no: 18, name: "Al-Kahf", arabic: "الكهف", ayahs: 110 },
  { no: 19, name: "Maryam", arabic: "مريم", ayahs: 98 },
  { no: 20, name: "Taha", arabic: "طه", ayahs: 135 },
  { no: 21, name: "Al-Anbiya", arabic: "الأنبياء", ayahs: 112 },
  { no: 22, name: "Al-Hajj", arabic: "الحج", ayahs: 78 },
  { no: 23, name: "Al-Mu'minun", arabic: "المؤمنون", ayahs: 118 },
  { no: 24, name: "An-Nur", arabic: "النور", ayahs: 64 },
  { no: 25, name: "Al-Furqan", arabic: "الفرقان", ayahs: 77 },
  { no: 26, name: "Ash-Shu'ara", arabic: "الشعراء", ayahs: 227 },
  { no: 27, name: "An-Naml", arabic: "النمل", ayahs: 93 },
  { no: 28, name: "Al-Qasas", arabic: "القصص", ayahs: 88 },
  { no: 29, name: "Al-'Ankabut", arabic: "العنكبوت", ayahs: 69 },
  { no: 30, name: "Ar-Rum", arabic: "الروم", ayahs: 60 },
  { no: 31, name: "Luqman", arabic: "لقمان", ayahs: 34 },
  { no: 32, name: "As-Sajdah", arabic: "السجدة", ayahs: 30 },
  { no: 33, name: "Al-Ahzab", arabic: "الأحزاب", ayahs: 73 },
  { no: 34, name: "Saba", arabic: "سبإ", ayahs: 54 },
  { no: 35, name: "Fatir", arabic: "فاطر", ayahs: 45 },
  { no: 36, name: "Ya-Sin", arabic: "يس", ayahs: 83 },
  { no: 37, name: "As-Saffat", arabic: "الصافات", ayahs: 182 },
  { no: 38, name: "Sad", arabic: "ص", ayahs: 88 },
  { no: 39, name: "Az-Zumar", arabic: "الزمر", ayahs: 75 },
  { no: 40, name: "Ghafir", arabic: "غافر", ayahs: 85 },
  { no: 41, name: "Fussilat", arabic: "فصلت", ayahs: 54 },
  { no: 42, name: "Ash-Shura", arabic: "الشورى", ayahs: 53 },
  { no: 43, name: "Az-Zukhruf", arabic: "الزخرف", ayahs: 89 },
  { no: 44, name: "Ad-Dukhan", arabic: "الدخان", ayahs: 59 },
  { no: 45, name: "Al-Jathiyah", arabic: "الجاثية", ayahs: 37 },
  { no: 46, name: "Al-Ahqaf", arabic: "الأحقاف", ayahs: 35 },
  { no: 47, name: "Muhammad", arabic: "محمد", ayahs: 38 },
  { no: 48, name: "Al-Fath", arabic: "الفتح", ayahs: 29 },
  { no: 49, name: "Al-Hujurat", arabic: "الحجرات", ayahs: 18 },
  { no: 50, name: "Qaf", arabic: "ق", ayahs: 45 },
  { no: 51, name: "Adh-Dhariyat", arabic: "الذاريات", ayahs: 60 },
  { no: 52, name: "At-Tur", arabic: "الطور", ayahs: 49 },
  { no: 53, name: "An-Najm", arabic: "النجم", ayahs: 62 },
  { no: 54, name: "Al-Qamar", arabic: "القمر", ayahs: 55 },
  { no: 55, name: "Ar-Rahman", arabic: "الرحمن", ayahs: 78 },
  { no: 56, name: "Al-Waqi'ah", arabic: "الواقعة", ayahs: 96 },
  { no: 57, name: "Al-Hadid", arabic: "الحديد", ayahs: 29 },
  { no: 58, name: "Al-Mujadila", arabic: "المجادلة", ayahs: 22 },
  { no: 59, name: "Al-Hashr", arabic: "الحشر", ayahs: 24 },
  { no: 60, name: "Al-Mumtahanah", arabic: "الممتحنة", ayahs: 13 },
  { no: 61, name: "As-Saff", arabic: "الصف", ayahs: 14 },
  { no: 62, name: "Al-Jumu'ah", arabic: "الجمعة", ayahs: 11 },
  { no: 63, name: "Al-Munafiqun", arabic: "المنافقون", ayahs: 11 },
  { no: 64, name: "At-Taghabun", arabic: "التغابن", ayahs: 18 },
  { no: 65, name: "At-Talaq", arabic: "الطلاق", ayahs: 12 },
  { no: 66, name: "At-Tahrim", arabic: "التحريم", ayahs: 12 },
  { no: 67, name: "Al-Mulk", arabic: "الملك", ayahs: 30 },
  { no: 68, name: "Al-Qalam", arabic: "القلم", ayahs: 52 },
  { no: 69, name: "Al-Haqqah", arabic: "الحاقة", ayahs: 52 },
  { no: 70, name: "Al-Ma'arij", arabic: "المعارج", ayahs: 44 },
  { no: 71, name: "Nuh", arabic: "نوح", ayahs: 28 },
  { no: 72, name: "Al-Jinn", arabic: "الجن", ayahs: 28 },
  { no: 73, name: "Al-Muzzammil", arabic: "المزمل", ayahs: 20 },
  { no: 74, name: "Al-Muddaththir", arabic: "المدثر", ayahs: 56 },
  { no: 75, name: "Al-Qiyamah", arabic: "القيامة", ayahs: 40 },
  { no: 76, name: "Al-Insan", arabic: "الإنسان", ayahs: 31 },
  { no: 77, name: "Al-Mursalat", arabic: "المرسلات", ayahs: 50 },
  { no: 78, name: "An-Naba", arabic: "النبإ", ayahs: 40 },
  { no: 79, name: "An-Nazi'at", arabic: "النازعات", ayahs: 46 },
  { no: 80, name: "'Abasa", arabic: "عبس", ayahs: 42 },
  { no: 81, name: "At-Takwir", arabic: "التكوير", ayahs: 29 },
  { no: 82, name: "Al-Infitar", arabic: "الإنفطار", ayahs: 19 },
  { no: 83, name: "Al-Mutaffifin", arabic: "المطففين", ayahs: 36 },
  { no: 84, name: "Al-Inshiqaq", arabic: "الإنشقاق", ayahs: 25 },
  { no: 85, name: "Al-Buruj", arabic: "البروج", ayahs: 22 },
  { no: 86, name: "At-Tariq", arabic: "الطارق", ayahs: 17 },
  { no: 87, name: "Al-A'la", arabic: "الأعلى", ayahs: 19 },
  { no: 88, name: "Al-Ghashiyah", arabic: "الغاشية", ayahs: 26 },
  { no: 89, name: "Al-Fajr", arabic: "الفجر", ayahs: 30 },
  { no: 90, name: "Al-Balad", arabic: "البلد", ayahs: 20 },
  { no: 91, name: "Ash-Shams", arabic: "الشمس", ayahs: 15 },
  { no: 92, name: "Al-Layl", arabic: "الليل", ayahs: 21 },
  { no: 93, name: "Ad-Duhaa", arabic: "الضحى", ayahs: 11 },
  { no: 94, name: "Ash-Sharh", arabic: "الشرح", ayahs: 8 },
  { no: 95, name: "At-Tin", arabic: "التين", ayahs: 8 },
  { no: 96, name: "Al-'Alaq", arabic: "العلق", ayahs: 19 },
  { no: 97, name: "Al-Qadr", arabic: "القدر", ayahs: 5 },
  { no: 98, name: "Al-Bayyinah", arabic: "البينة", ayahs: 8 },
  { no: 99, name: "Az-Zalzalah", arabic: "الزلزلة", ayahs: 8 },
  { no: 100, name: "Al-'Adiyat", arabic: "العاديات", ayahs: 11 },
  { no: 101, name: "Al-Qari'ah", arabic: "القارعة", ayahs: 11 },
  { no: 102, name: "At-Takathur", arabic: "التكاثر", ayahs: 8 },
  { no: 103, name: "Al-'Asr", arabic: "العصر", ayahs: 3 },
  { no: 104, name: "Al-Humazah", arabic: "الهمزة", ayahs: 9 },
  { no: 105, name: "Al-Fil", arabic: "الفيل", ayahs: 5 },
  { no: 106, name: "Quraysh", arabic: "قريش", ayahs: 4 },
  { no: 107, name: "Al-Ma'un", arabic: "الماعون", ayahs: 7 },
  { no: 108, name: "Al-Kawthar", arabic: "الكوثر", ayahs: 3 },
  { no: 109, name: "Al-Kafirun", arabic: "الكافرون", ayahs: 6 },
  { no: 110, name: "An-Nasr", arabic: "النصر", ayahs: 3 },
  { no: 111, name: "Al-Masad", arabic: "المسد", ayahs: 5 },
  { no: 112, name: "Al-Ikhlas", arabic: "الإخلاص", ayahs: 4 },
  { no: 113, name: "Al-Falaq", arabic: "الفلق", ayahs: 5 },
  { no: 114, name: "An-Nas", arabic: "الناس", ayahs: 6 },
];

export const LOCAL_PRESET_AYAT = [
  {
    globalId: 262,
    surahNo: 2,
    surahName: "Al-Baqarah",
    surahNameArabic: "البقرة",
    ayahNo: 255,
    totalAyahsInSurah: 286,
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
    translation:
      "Allah! There is no deity except Him, the Ever-Living, the Sustainer of all existence.",
    juz: 3,
  },
  {
    globalId: 5241,
    surahNo: 67,
    surahName: "Al-Mulk",
    surahNameArabic: "الملك",
    ayahNo: 1,
    totalAyahsInSurah: 30,
    arabic:
      "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    translation:
      "Blessed is He in whose hand is dominion, and He is over all things competent.",
    juz: 29,
  },
];

/* ============================================================================
 * HEADER COMPONENT
 * ============================================================================ */
const Header = ({ useLiveApi, setUseLiveApi, score, streak, accuracyRate }) => {
  return (
    <header className="relative z-10 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between border-b-2 border-dashed border-stone-200/90 bg-[#F4EFE6]/90 backdrop-blur-md gap-4">
      <div className="flex items-center space-x-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center shadow-md transform -rotate-2 border border-emerald-800">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-xl text-stone-900 tracking-wide flex items-center gap-2">
            آيات Reference Studio
            <span className="text-[11px] font-sans bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 font-semibold">
              6,236 Verses
            </span>
          </h1>
          <p className="text-xs text-stone-500">
            Memorize & Test Surah & Ayah References
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setUseLiveApi(!useLiveApi)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all shadow-2xs ${
            useLiveApi
              ? "bg-emerald-800 text-white border-emerald-900"
              : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>
            {useLiveApi ? "Live Quran API (Active)" : "Preset Verses"}
          </span>
        </button>

        <div className="bg-white/90 border border-stone-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-2 transform rotate-1">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-stone-500">Points:</span>
          <span className="text-xs font-bold text-stone-800">{score}</span>
        </div>

        <div className="bg-white/90 border border-stone-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-2 transform -rotate-1">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-stone-500">Streak:</span>
          <span className="text-xs font-bold text-orange-600">{streak}</span>
        </div>

        <div className="bg-white/90 border border-stone-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-teal-600" />
          <span className="text-xs text-stone-500">Accuracy:</span>
          <span className="text-xs font-bold text-teal-700">
            {accuracyRate}%
          </span>
        </div>
      </div>
    </header>
  );
};

/* ============================================================================
 * VERSE CARD COMPONENT
 * ============================================================================ */
const VerseCard = ({
  currentAyah,
  isLoading,
  isPlayingAudio,
  toggleAudio,
  showHint,
  setShowHint,
  cardRotation,
  surahStatus,
  ayahStatus,
}) => {
  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="absolute inset-0 bg-stone-200/90 rounded-2xl transform rotate-2 scale-[0.98] border border-stone-300/80 shadow-xs pointer-events-none"></div>
      <div className="absolute inset-0 bg-amber-50/90 rounded-2xl transform -rotate-1 scale-[0.99] border border-amber-200/80 shadow-xs pointer-events-none"></div>

      <div
        className={`w-full bg-[#FFFDF9] rounded-2xl border-2 transition-all duration-300 p-6 sm:p-8 relative shadow-xl transform ${
          surahStatus === "correct" && ayahStatus === "correct"
            ? "border-emerald-500 ring-4 ring-emerald-200/60"
            : "border-stone-300/90"
        }`}
        style={{ transform: `rotate(${cardRotation}deg)` }}
      >
        <div className="absolute -top-3 left-8 w-16 h-6 bg-amber-100/90 border border-amber-200 rounded-xs transform -rotate-6 shadow-2xs pointer-events-none"></div>
        <div className="absolute -top-3 right-8 w-16 h-6 bg-amber-100/90 border border-amber-200 rounded-xs transform rotate-3 shadow-2xs pointer-events-none"></div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="font-serif italic text-sm">
              Fetching Ayah from Live Quran Network...
            </p>
          </div>
        ) : currentAyah ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-dashed border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded border border-stone-200">
                  Ayah #{currentAyah.globalId || "?"} in Quran
                </span>
                {currentAyah.juz && (
                  <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                    Juz {currentAyah.juz}
                  </span>
                )}
              </div>

              <button
                onClick={toggleAudio}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition ${
                  isPlayingAudio
                    ? "bg-emerald-600 text-white border-emerald-700 animate-pulse"
                    : "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-300"
                }`}
              >
                {isPlayingAudio ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span>
                  {isPlayingAudio ? "Pause Recitation" : "Listen Recitation"}
                </span>
              </button>
            </div>

            <div className="text-right py-3 px-1">
              <p
                className="font-serif text-2xl sm:text-3xl text-stone-900 leading-relaxed sm:leading-loose tracking-wide"
                dir="rtl"
                style={{
                  fontFamily:
                    "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif",
                }}
              >
                {currentAyah.arabic}
              </p>
            </div>

            <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800/80 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
                English Translation
              </span>
              <p className="text-sm sm:text-base text-stone-700 font-serif italic mt-2 leading-relaxed">
                "{currentAyah.translation}"
              </p>
            </div>

            {showHint && (
              <div className="bg-amber-50/90 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Reference Hint:</strong> This Surah contains a total
                  of {currentAyah.totalAyahsInSurah} verses and is located in
                  Juz {currentAyah.juz || "N/A"}.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-stone-500 hover:text-amber-800 transition flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? "Hide Hint" : "Show Hint"}</span>
              </button>

              <span className="italic text-[11px]">
                Select correct Surah & Verse Number below
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* ============================================================================
 * QUIZ CONTROLS COMPONENT
 * ============================================================================ */
const QuizControls = ({
  currentAyah,
  surahOptions,
  ayahNoOptions,
  selectedSurah,
  selectedAyahNo,
  surahStatus,
  ayahStatus,
  handleSelectSurah,
  handleSelectAyahNo,
  loadNextAyah,
}) => {
  return (
    <div className="w-full bg-white/80 border border-stone-300 p-5 rounded-2xl shadow-sm backdrop-blur-xs space-y-6">
      {/* STEP 1: SELECT SURAH NAME */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            Step 1: Identify Surah Name
          </span>

          {surahStatus === "correct" && (
            <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Correct Surah!
            </span>
          )}
          {surahStatus === "wrong" && (
            <span className="text-xs text-rose-600 font-bold bg-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Wrong Surah. Try again!
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {surahOptions.map((surah) => {
            const isSelected = selectedSurah?.no === surah.no;
            const isCorrectChoice = surah.no === currentAyah.surahNo;

            let btnStyle =
              "border-stone-200 bg-white hover:bg-stone-50 text-stone-800";

            if (isSelected) {
              if (isCorrectChoice) {
                btnStyle =
                  "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/40";
              } else {
                btnStyle =
                  "border-rose-400 bg-rose-50 text-rose-900 ring-2 ring-rose-400/40";
              }
            }

            return (
              <button
                key={surah.no}
                onClick={() => handleSelectSurah(surah)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between relative shadow-2xs ${btnStyle}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-stone-400">
                    #{surah.no}
                  </span>
                  <span className="font-serif text-xs text-stone-600" dir="rtl">
                    {surah.arabic}
                  </span>
                </div>
                <span className="text-xs font-bold mt-2 truncate">
                  {surah.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: SELECT AYAH NUMBER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
              2
            </span>
            Step 2: Identify Ayah (Verse) Number
          </span>

          {ayahStatus === "correct" && (
            <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Correct Verse Number!
            </span>
          )}
          {ayahStatus === "wrong" && (
            <span className="text-xs text-rose-600 font-bold bg-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Incorrect Verse Number.
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ayahNoOptions.map((num) => {
            const isSelected = selectedAyahNo === num;
            const isCorrectNum = num === currentAyah.ayahNo;

            let btnStyle =
              "border-stone-200 bg-white hover:bg-stone-50 text-stone-800";

            if (isSelected) {
              if (isCorrectNum) {
                btnStyle =
                  "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/40";
              } else {
                btnStyle =
                  "border-rose-400 bg-rose-50 text-rose-900 ring-2 ring-rose-400/40";
              }
            }

            return (
              <button
                key={num}
                onClick={() => handleSelectAyahNo(num)}
                className={`py-3 px-4 rounded-xl border font-mono font-bold text-center text-sm transition-all shadow-2xs ${btnStyle}`}
              >
                Ayah {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 3: NEXT CARD ACTION BAR */}
      {surahStatus === "correct" && ayahStatus === "correct" && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center justify-between text-emerald-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">
              Reference Mastered! ({currentAyah.surahName} : Verse{" "}
              {currentAyah.ayahNo})
            </span>
          </div>
          <button
            onClick={loadNextAyah}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <span>Next Ayah</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * MAIN MEMORIZER CONTAINER
 * ============================================================================ */
export default function QuranMemorizer() {
  const [useLiveApi, setUseLiveApi] = useState(true);
  const [currentAyah, setCurrentAyah] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setApiError] = useState(null);

  // Statistics
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [, setMasteredCount] = useState(0);

  // Quiz Choice State
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [selectedAyahNo, setSelectedAyahNo] = useState(null);
  const [surahStatus, setSurahStatus] = useState(null);
  const [ayahStatus, setAyahStatus] = useState(null);

  // UI Options
  const [showHint, setShowHint] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [cardRotation, setCardRotation] = useState(-1.5);
  const audioRef = useRef(null);

  const fetchRandomAyahFromApi = async () => {
    setIsLoading(true);
    setApiError(null);
    setSelectedSurah(null);
    setSelectedAyahNo(null);
    setSurahStatus(null);
    setAyahStatus(null);
    setShowHint(false);
    setIsPlayingAudio(false);

    const randomVerseId = Math.floor(Math.random() * 6236) + 1;

    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/ayah/${randomVerseId}/editions/quran-uthmani,en.sahih,ar.alafasy`,
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
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

        const fetchedAyah = {
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

        setCurrentAyah(fetchedAyah);
      } else {
        throw new Error("Invalid payload structure from Quran API");
      }
    } catch (err) {
      console.error("Failed to fetch random verse:", err);
      setApiError("Unable to connect to Quran API. Loaded fallback verse.");
      const fallback =
        LOCAL_PRESET_AYAT[Math.floor(Math.random() * LOCAL_PRESET_AYAT.length)];
      setCurrentAyah(fallback);
    } finally {
      setIsLoading(false);
      setCardRotation(parseFloat((Math.random() * 4 - 2).toFixed(2)));
    }
  };

  const loadNextAyah = () => {
    if (useLiveApi) {
      fetchRandomAyahFromApi();
    } else {
      const randomPreset =
        LOCAL_PRESET_AYAT[Math.floor(Math.random() * LOCAL_PRESET_AYAT.length)];
      setCurrentAyah(randomPreset);
      setSelectedSurah(null);
      setSelectedAyahNo(null);
      setSurahStatus(null);
      setAyahStatus(null);
      setShowHint(false);
      setIsPlayingAudio(false);
      setCardRotation(parseFloat((Math.random() * 4 - 2).toFixed(2)));
    }
  };

  useEffect(() => {
    loadNextAyah();
  }, [useLiveApi]);

  const surahOptions = useMemo(() => {
    if (!currentAyah) return [];

    const correctSurah = SURAH_LIST.find(
      (s) => s.no === currentAyah.surahNo,
    ) || {
      no: currentAyah.surahNo,
      name: currentAyah.surahName,
      arabic: currentAyah.surahNameArabic,
      ayahs: currentAyah.totalAyahsInSurah,
    };

    const decoys = SURAH_LIST.filter((s) => s.no !== currentAyah.surahNo)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    return [correctSurah, ...decoys].sort(() => 0.5 - Math.random());
  }, [currentAyah]);

  const ayahNoOptions = useMemo(() => {
    if (!currentAyah) return [];

    const correctAyahNo = currentAyah.ayahNo;
    const totalInSurah = currentAyah.totalAyahsInSurah || 100;
    const decoys = new Set();

    let attempts = 0;
    while (decoys.size < 3 && attempts < 50) {
      attempts++;
      const offset = Math.floor(Math.random() * 11) - 5;
      const candidate = correctAyahNo + offset;
      if (
        candidate > 0 &&
        candidate <= totalInSurah &&
        candidate !== correctAyahNo
      ) {
        decoys.add(candidate);
      } else {
        const randomCand = Math.floor(Math.random() * totalInSurah) + 1;
        if (randomCand !== correctAyahNo) decoys.add(randomCand);
      }
    }

    const options = [correctAyahNo, ...Array.from(decoys)];
    return options.sort((a, b) => a - b);
  }, [currentAyah]);

  const checkOverallCompletion = (isSurahDone, isAyahDone) => {
    if (isSurahDone && isAyahDone) {
      setCorrectAttempts((prev) => prev + 1);
      setMasteredCount((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    }
  };

  const handleSelectSurah = (surah) => {
    if (!currentAyah) return;
    setSelectedSurah(surah);
    setTotalAttempts((prev) => prev + 1);

    if (surah.no === currentAyah.surahNo) {
      setSurahStatus("correct");
      setScore((prev) => prev + 5);
      checkOverallCompletion(true, selectedAyahNo === currentAyah.ayahNo);
    } else {
      setSurahStatus("wrong");
      setStreak(0);
    }
  };

  const handleSelectAyahNo = (num) => {
    if (!currentAyah) return;
    setSelectedAyahNo(num);
    setTotalAttempts((prev) => prev + 1);

    if (num === currentAyah.ayahNo) {
      setAyahStatus("correct");
      setScore((prev) => prev + 5);
      checkOverallCompletion(selectedSurah?.no === currentAyah.surahNo, true);
    } else {
      setAyahStatus("wrong");
      setStreak(0);
    }
  };

  const toggleAudio = () => {
    if (!currentAyah?.audioUrl) return;

    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = currentAyah.audioUrl;
        audioRef.current
          .play()
          .catch((e) => console.error("Audio playback error:", e));
        setIsPlayingAudio(true);
      }
    }
  };

  const accuracyRate =
    totalAttempts > 0
      ? Math.round((correctAttempts / totalAttempts) * 100)
      : 100;

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-stone-800 flex flex-col font-sans relative overflow-hidden select-none">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => setIsPlayingAudio(false)}
      />

      {/* Background Styling Canvas */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-emerald-200/50 blur-3xl transform -rotate-12"></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-amber-200/50 blur-3xl transform rotate-45"></div>
        <div className="absolute -bottom-24 left-1/3 w-[32rem] h-[32rem] rounded-full bg-teal-100/60 blur-3xl"></div>

        <div
          className="w-full h-full opacity-15"
          style={{
            backgroundImage: `radial-gradient(#333 0.75px, transparent 0.75px), radial-gradient(#333 0.75px, #FAF7F0 0.75px)`,
            backgroundSize: `28px 28px`,
            backgroundPosition: `0 0, 14px 14px`,
          }}
        ></div>
      </div>

      <Header
        useLiveApi={useLiveApi}
        setUseLiveApi={setUseLiveApi}
        score={score}
        streak={streak}
        accuracyRate={accuracyRate}
      />

      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-between gap-6">
        <div className="w-full flex items-center justify-between text-xs text-stone-500 px-1">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-emerald-700" />
            <span>
              Source:{" "}
              <strong className="text-stone-800">
                {useLiveApi
                  ? "Full Quran (Global Random API)"
                  : "Featured Verses Deck"}
              </strong>
            </span>
          </div>

          <button
            onClick={loadNextAyah}
            disabled={isLoading}
            className="flex items-center gap-1.5 hover:text-stone-900 transition bg-white/80 px-3 py-1.5 rounded-xl border border-stone-300 shadow-2xs font-semibold text-stone-700"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Draw New Verse</span>
          </button>
        </div>

        <VerseCard
          currentAyah={currentAyah}
          isLoading={isLoading}
          isPlayingAudio={isPlayingAudio}
          toggleAudio={toggleAudio}
          showHint={showHint}
          setShowHint={setShowHint}
          cardRotation={cardRotation}
          surahStatus={surahStatus}
          ayahStatus={ayahStatus}
        />

        {currentAyah && !isLoading && (
          <QuizControls
            currentAyah={currentAyah}
            surahOptions={surahOptions}
            ayahNoOptions={ayahNoOptions}
            selectedSurah={selectedSurah}
            selectedAyahNo={selectedAyahNo}
            surahStatus={surahStatus}
            ayahStatus={ayahStatus}
            handleSelectSurah={handleSelectSurah}
            handleSelectAyahNo={handleSelectAyahNo}
            loadNextAyah={loadNextAyah}
          />
        )}
      </main>

      <footer className="relative z-10 py-3 text-center text-xs text-stone-400 border-t border-stone-200/80 bg-white/50 backdrop-blur-2xs">
        Quran Verse Reference Memorizer • Connected to Live AlQuran Cloud Public
        API
      </footer>
    </div>
  );
}
