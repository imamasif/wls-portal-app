import React from 'react';
import styles from './ColorScoreSlider.module.css';

export function ColorScoreSlider({ label, value = 1, onChange, max = 10 }) {
  const getColorClass = (val) => {
    switch (Number(val)) {
      case 1: return styles.score1;
      case 2: return styles.score2;
      case 3: return styles.score3;
      case 4: return styles.score4;
      case 5: return styles.score5;
      case 6: return styles.score6;
      case 7: return styles.score7;
      case 8: return styles.score8;
      case 9: return styles.score9;
      case 10: return styles.score10;
      default: return styles.scoreDefault;
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.badge} ${getColorClass(value)}`}>
          {value} / {max}
        </span>
      </div>
      <input
        type="range"
        min="1"
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.rangeInput}
      />
    </div>
  );
}