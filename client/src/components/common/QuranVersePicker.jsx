import React, { useState } from 'react';
import styles from './QuranVersePicker.module.css';

const SURAH_LIST = [
  { id: 1, name: '1. Al-Fatihah', verses: 7 },
  { id: 2, name: '2. Al-Baqarah', verses: 286 },
  { id: 3, name: '3. Ali Imran', verses: 200 },
  { id: 4, name: '4. An-Nisa', verses: 176 },
  { id: 5, name: '5. Al-Ma\'idah', verses: 120 },
  { id: 18, name: '18. Al-Kahf', verses: 110 },
  { id: 36, name: '36. Ya-Sin', verses: 83 },
  { id: 67, name: '67. Al-Mulk', verses: 30 },
  { id: 112, name: '112. Al-Ikhlas', verses: 4 },
  { id: 113, name: '113. Al-Falaq', verses: 5 },
  { id: 114, name: '114. An-Nas', verses: 6 }
];

export function QuranVersePicker({ selectedAyats = [], onChange }) {
  const [selectedSurahId, setSelectedSurahId] = useState(1);
  const [selectedAyatNum, setSelectedAyatNum] = useState(1);

  const activeSurah = SURAH_LIST.find((s) => s.id === Number(selectedSurahId)) || SURAH_LIST[0];

  const handleAddAyat = () => {
    const newItem = {
      surahId: activeSurah.id,
      surahName: activeSurah.name,
      ayatNumber: Number(selectedAyatNum)
    };

    const exists = selectedAyats.some(
      (item) => item.surahId === newItem.surahId && item.ayatNumber === newItem.ayatNumber
    );

    if (exists) {
      alert('This Ayat is already added.');
      return;
    }

    onChange([...selectedAyats, newItem]);
  };

  const handleRemoveAyat = (index) => {
    onChange(selectedAyats.filter((_, idx) => idx !== index));
  };

  return (
    <div className={styles.container}>
      <label className={styles.sectionLabel}>📖 Select Quranic Surah & Ayats</label>
      
      <div className={styles.pickerRow}>
        <select
          value={selectedSurahId}
          onChange={(e) => {
            setSelectedSurahId(Number(e.target.value));
            setSelectedAyatNum(1);
          }}
          className={styles.surahSelect}
        >
          {SURAH_LIST.map((surah) => (
            <option key={surah.id} value={surah.id}>{surah.name}</option>
          ))}
        </select>

        <select
          value={selectedAyatNum}
          onChange={(e) => setSelectedAyatNum(Number(e.target.value))}
          className={styles.ayatSelect}
        >
          {Array.from({ length: activeSurah.verses }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>Ayat {num}</option>
          ))}
        </select>

        <button type="button" onClick={handleAddAyat} className={styles.btnAdd}>
          + Add Verse
        </button>
      </div>

      <div className={styles.badgeContainer}>
        {selectedAyats.map((item, idx) => (
          <span key={idx} className={styles.verseBadge}>
            {item.surahName.split(' ')[1]} : Verse {item.ayatNumber}
            <button type="button" onClick={() => handleRemoveAyat(idx)} className={styles.btnRemove}>✕</button>
          </span>
        ))}
      </div>
    </div>
  );
}