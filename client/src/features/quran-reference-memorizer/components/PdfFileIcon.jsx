import React from "react";

/**
 * Real Adobe-Style PDF Document SVG File Icon
 * Features:
 * - Crisp vector sheet with rounded corners
 * - Folded top-right corner dog-ear flap
 * - Central Adobe Acrobat ribbon loop symbol
 * - Crimson red bottom banner with bold white "PDF" typography
 */
export function PdfFileIcon({
  size = 38,
  width,
  height,
  className = "",
  style = {},
  ...props
}) {
  const h = height || size;
  const w = width || Math.round((h * 100) / 118);

  return (
    <svg
      viewBox="0 0 100 118"
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    >
      {/* Base Paper Sheet with rounded corners & top-right diagonal fold cut */}
      <path
        d="M 10 0 
           L 72 0 
           L 100 28 
           L 100 108 
           A 10 10 0 0 1 90 118 
           L 10 118 
           A 10 10 0 0 1 0 108 
           L 0 10 
           A 10 10 0 0 1 10 0 Z"
        fill="#EDEAE4"
      />

      {/* Top-right corner fold flap (dog-ear) */}
      <path
        d="M 72 0 
           L 72 28 
           L 100 28 Z"
        fill="#DDD7CD"
      />
      <line x1="72" y1="0" x2="72" y2="28" stroke="#D3CCC1" strokeWidth="0.8" />
      <line x1="72" y1="28" x2="100" y2="28" stroke="#D3CCC1" strokeWidth="0.8" />

      {/* Adobe Acrobat ribbon symbol */}
      <path
        d="M 50 15 
           C 53.5 15, 56.5 24, 54 36 
           C 51 46, 43 54, 37 57.5 
           C 31 61, 27.5 61, 26 58 
           C 24.5 53.5, 29 49, 37 47 
           C 45 45, 55 45, 63 47 
           C 71 49, 75.5 53.5, 74 58 
           C 72.5 61, 69 61, 63 57.5 
           C 57 54, 49 46, 46 36 
           C 43.5 24, 46.5 15, 50 15 Z"
        fill="none"
        stroke="#B93B48"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom Crimson Banner */}
      <path
        d="M 0 80 
           L 100 80 
           L 100 108 
           A 10 10 0 0 1 90 118 
           L 10 118 
           A 10 10 0 0 1 0 108 Z"
        fill="#B93B48"
      />

      {/* Bold White "PDF" Typography */}
      <text
        x="50"
        y="106.5"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontSize="25"
        fontWeight="900"
        letterSpacing="1.2"
        textAnchor="middle"
      >
        PDF
      </text>
    </svg>
  );
}

export default PdfFileIcon;
