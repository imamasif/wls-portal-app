import React, { useEffect, useState } from 'react';
import { Country, State, City } from 'country-state-city';

export function LocationSelector({
  selectedCountryCode,
  setSelectedCountryCode,
  selectedStateCode,
  setSelectedStateCode,
  selectedCity,
  setSelectedCity
}) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Update states whenever country changes
  useEffect(() => {
    if (selectedCountryCode) {
      const fetchedStates = State.getStatesOfCountry(selectedCountryCode);
      setStates(fetchedStates);
      
      // Auto-fallback if state is invalid for country
      if (fetchedStates.length > 0 && !fetchedStates.some((s) => s.isoCode === selectedStateCode)) {
        setSelectedStateCode(fetchedStates[0].isoCode);
      }
    } else {
      setStates([]);
    }
  }, [selectedCountryCode]);

  // Update cities whenever country or state changes
  useEffect(() => {
    if (selectedCountryCode && selectedStateCode) {
      // Handle lookup if state string is full name instead of ISO code
      let effectiveStateCode = selectedStateCode;
      const matchingState = states.find(
        (s) => s.isoCode === selectedStateCode || s.name.toLowerCase() === selectedStateCode.toLowerCase()
      );
      if (matchingState) {
        effectiveStateCode = matchingState.isoCode;
      }

      const fetchedCities = City.getCitiesOfState(selectedCountryCode, effectiveStateCode);
      setCities(fetchedCities);
    } else {
      setCities([]);
    }
  }, [selectedCountryCode, selectedStateCode, states]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
          Country
        </label>
        <select
          value={selectedCountryCode}
          onChange={(e) => setSelectedCountryCode(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
        >
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
          State / Province
        </label>
        <select
          value={selectedStateCode}
          onChange={(e) => setSelectedStateCode(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
        >
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
          City
        </label>
        {cities.length > 0 ? (
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          >
            <option value="">Select City</option>
            {cities.map((city, idx) => (
              <option key={`${city.name}-${idx}`} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder="Enter City"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          />
        )}
      </div>
    </div>
  );
}