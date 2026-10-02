import React from "react";

export const Trunks = ({ lemma, meaning }) => {
  return (
    <div className="relative flex flex-col items-center justify-center my-2">
      {/* Visual Trunk Connector */}
      <div className="w-8 h-12 bg-gradient-to-b from-amber-800 to-amber-950 rounded-sm shadow-inner" />

      {/* Core Trunk Node */}
      <div className="z-10 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 border-2 border-amber-600 text-amber-100 px-6 py-3 rounded-xl shadow-xl flex flex-col items-center">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Primary Form (Lemma)
        </span>
        <span className="text-2xl font-bold font-serif text-amber-200 my-0.5">
          {lemma}
        </span>
        <span className="text-xs text-amber-300/80 italic">{meaning}</span>
      </div>

      <div className="w-8 h-12 bg-gradient-to-b from-amber-800 to-amber-900 rounded-sm shadow-inner" />
    </div>
  );
};
