import React from 'react';
import { Country, State } from 'country-state-city';
import styles from './AuthModal.module.css';

export function LocationSelector({
  selectedCountryCode,
  setSelectedCountryCode,
  selectedStateCode,
  setSelectedStateCode,
  selectedCity,
  setSelectedCity,
}) {
  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(selectedCountryCode);

  return (
    <div className={styles.formRow3}>
      <div className={styles.formGroup}>
        <label>Country</label>
        <select
          value={selectedCountryCode}
          onChange={(e) => {
            setSelectedCountryCode(e.target.value);
            const statesList = State.getStatesOfCountry(e.target.value);
            if (statesList.length > 0) {
              setSelectedStateCode(statesList[0].isoCode);
            } else {
              setSelectedStateCode('');
            }
          }}
        >
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>State / Province</label>
        <select
          value={selectedStateCode}
          onChange={(e) => setSelectedStateCode(e.target.value)}
        >
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>City</label>
        <input
          type="text"
          placeholder="City"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        />
      </div>
    </div>
  );
}