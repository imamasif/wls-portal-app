import React from "react";

export const WordsRoots = ({ rootData }) => {
  if (!rootData) return null;

  return (
    <div className="flex flex-col items-center bg-amber-950/80 border-t-4 border-amber-800 p-4 rounded-b-2xl w-full text-amber-100 shadow-2xl">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-extrabold text-amber-300 tracking-widest dir-rtl font-serif">
          {rootData.rootArabic}
        </span>
        <span className="bg-amber-800/60 text-xs px-2.5 py-1 rounded-full text-amber-200 border border-amber-600/40">
          Root ({rootData.rootEnglish})
        </span>
      </div>
      <p className="text-sm font-medium text-amber-200/90 mt-1">
        "{rootData.meaning}"
      </p>
      <div className="text-xs text-amber-400/80 mt-1">
        Occurs{" "}
        <span className="font-bold text-amber-300">{rootData.occurrences}</span>{" "}
        times in Quran
      </div>
    </div>
  );
};
