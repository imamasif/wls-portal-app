import React, { useState } from "react";
import { Layers, Play } from "lucide-react";

/**
 * 3D Media Icon Badge for Categories and Lectures
 * Styled with tactile 3D drop-shadow and smooth hover effect, matching the PDF document icon.
 * Includes graceful fallback if an image has not yet been placed in the public directory.
 */
export function MediaIconBadge({
  src,
  alt = "",
  size = 24,
  type = "category", // "category" | "lecture"
  className = "",
  style = {},
  fallbackIcon,
  ...props
}) {
  const [hasError, setHasError] = useState(!src);

  // If no source or failed to load image, render matching 3D badge placeholder
  if (hasError || !src) {
    const isCategory = type === "category";
    const FallbackComponent = fallbackIcon || (isCategory ? Layers : Play);
    const radius = Math.max(5, Math.round(size * 0.22));

    return (
      <span
        className={`media-icon-badge-fallback ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: radius,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: isCategory
            ? "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)"
            : "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
          color: "#ffffff",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          verticalAlign: "middle",
          userSelect: "none",
          ...style,
        }}
        title={alt || (isCategory ? "Category Icon" : "Lecture Icon")}
        {...props}
      >
        <FallbackComponent size={Math.round(size * 0.52)} fill={!isCategory ? "currentColor" : "none"} />
      </span>
    );
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
