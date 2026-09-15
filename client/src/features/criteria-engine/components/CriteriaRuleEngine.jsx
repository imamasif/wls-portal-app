import React, { useState } from 'react';
import styles from './CriteriaRuleEngine.module.css';

export function CriteriaRuleEngine({ initialCriteria = [], onSaveCriteria }) {
  const [criteria, setCriteria] = useState(
    initialCriteria.length > 0
      ? initialCriteria
      : [
          'Presentation - camera position, Light, Picture and Sound Quality - Video Size',
          'Attire / Dress Code',
          'Arabic Reading',
          'On Time Delivery',
          'Transference of Spirit',
          'Body Language'
        ]
  );
  const [newCriterion, setNewCriterion] = useState('');

  const handleAdd = () => {
    if (!newCriterion.trim()) return;
    const updated = [...criteria, newCriterion.trim()];
    setCriteria(updated);
    setNewCriterion('');
    if (onSaveCriteria) onSaveCriteria(updated);
  };

  const handleRemove = (index) => {
    const updated = criteria.filter((_, i) => i !== index);
    setCriteria(updated);
    if (onSaveCriteria) onSaveCriteria(updated);
  };

  return (
    <div className={styles.card}>
      <h2>⚙️ Criteria Rule Engine Setup</h2>
      <p className={styles.subtitle}>Configure rubric template criteria used by WLS-Admins during user evaluation.</p>

      <div className={styles.inputRow}>
        <input
          type="text"
          placeholder="Enter new criterion description..."
          value={newCriterion}
          onChange={(e) => setNewCriterion(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleAdd} className={styles.btnAdd}>
          + Add Criterion
        </button>
      </div>

      <div className={styles.list}>
        {criteria.map((item, idx) => (
          <div key={idx} className={styles.itemRow}>
            <span><strong>{idx + 1}.</strong> {item}</span>
            <button onClick={() => handleRemove(idx)} className={styles.btnDelete}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}