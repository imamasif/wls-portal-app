import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import styles from './PhoneListInput.module.css';

export function PhoneListInput({ phones = [], onChange }) {
  const handleAddPhone = () => {
    onChange([
      ...phones,
      { number: '', type: 'Mobile', isPrimary: phones.length === 0 }
    ]);
  };

  const handleRemovePhone = (index) => {
    const updated = phones.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((p) => p.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleChange = (index, key, value) => {
    const updated = [...phones];
    updated[index][key] = value;
    if (key === 'isPrimary' && value === true) {
      updated.forEach((p, i) => {
        p.isPrimary = i === index;
      });
    }
    onChange(updated);
  };

  return (
    <div className={styles.phoneContainer}>
      <div className={styles.header}>
        <label className={styles.label}>Phone / Mobile Numbers</label>
        <button
          type="button"
          onClick={handleAddPhone}
          className={styles.addBtn}
        >
          + Add Phone
        </button>
      </div>

      <div className={styles.phoneList}>
        {phones.length === 0 ? (
          <p className={styles.emptyText}>No phone numbers added yet.</p>
        ) : (
          phones.map((phone, index) => (
            <div key={index} className={styles.phoneRow}>
              <select
                value={phone.type}
                onChange={(e) => handleChange(index, 'type', e.target.value)}
                className={styles.typeSelect}
              >
                <option value="Mobile">Mobile</option>
                <option value="Work">Work</option>
                <option value="Home">Home</option>
                <option value="Other">Other</option>
              </select>

              <div className={styles.phoneInputWrapper}>
                <PhoneInput
                  international
                  defaultCountry="CA"
                  value={phone.number}
                  onChange={(val) => handleChange(index, 'number', val || '')}
                  className={styles.customPhoneInput}
                />
              </div>

              <label className={styles.primaryRadio}>
                <input
                  type="radio"
                  name="primaryPhone"
                  checked={phone.isPrimary || false}
                  onChange={() => handleChange(index, 'isPrimary', true)}
                />
                Primary
              </label>

              <button
                type="button"
                onClick={() => handleRemovePhone(index)}
                className={styles.removeBtn}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}