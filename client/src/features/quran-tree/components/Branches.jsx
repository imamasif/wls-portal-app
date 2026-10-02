import React from "react";

export const Branches = ({ derivatives = [] }) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {derivatives.map((item) => (
        <div
          key={item.id}
          className="relative group bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/50 hover:border-emerald-400 p-4 rounded-2xl shadow-lg transition-all duration-300 flex flex-col justify-between"
        >
          {/* Top Tag Badges: Gender, Number & Part of Speech */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-500/30">
              {item.pos}
            </span>
            <div className="flex gap-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.gender === "M"
                    ? "bg-blue-900/80 text-blue-200 border border-blue-500/40"
                    : "bg-rose-900/80 text-rose-200 border border-rose-500/40"
                }`}
              >
                {item.gender === "M" ? "Masculine (مذكر)" : "Feminine (مؤنث)"}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-900/80 text-amber-200 border border-amber-500/40">
                {item.number === "S"
                  ? "Singular (مفرد)"
                  : item.number === "D"
                    ? "Dual (مثنى)"
                    : "Plural (جمع)"}
              </span>
            </div>
          </div>

          {/* Leaf Word Center */}
          <div className="text-center my-2">
            <h3 className="text-3xl font-bold font-serif text-emerald-100 group-hover:text-amber-300 transition-colors">
              {item.wordArabic}
            </h3>
            <p className="text-xs font-semibold text-emerald-400/90 mt-1">
              {item.transliteration}
            </p>
            <p className="text-sm text-emerald-200/80 mt-0.5">
              {item.translation}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
