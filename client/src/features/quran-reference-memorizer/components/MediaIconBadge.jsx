import React, { useState } from "react";

/**
 * 3D Media Icon Badge for Categories and Lectures
 * Rendered before category and lecture names.
 * Sized and styled with tactile 3D drop-shadow matching the PDF icon.
 * If nothing provided or if image fails to load, does not show anything (returns null).
 */
export function MediaIconBadge({
  src,
  alt = "",
  size = 24,
  className = "",
  style = {},
  ...props
}) {
  const [hasError, setHasError] = useState(false);

  // If nothing or on error, do not show anything
  if (!src || typeof src !== "string" || !src.trim() || hasError) {
    return null;
  }

  const radius = Math.max(5, Math.round(size * 0.22));

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={`media-icon-badge-img ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: radius,
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        backgroundColor: "#ffffff",
        padding: "2px",
        filter: "drop-shadow(0 2px 5px rgba(0, 0, 0, 0.22))",
        border: "1px solid rgba(255, 255, 255, 0.45)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
        userSelect: "none",
        ...style,
      }}
      {...props}
    />
  );
}

export default MediaIconBadge;
