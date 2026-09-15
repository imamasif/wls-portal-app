import React from 'react';
import styles from './SliderCountSelector.module.css';

export function SliderCountSelector({ label, min = 1, max = 100, step = 1, value, onChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label className={styles.label}>{label}</label>
        <span className={styles.badge}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
      />
    </div>
  );
}