// src/components/common/LocationSelector.jsx
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

  useEffect(() => {
    if (selectedCountryCode) {
      const fetchedStates = State.getStatesOfCountry(selectedCountryCode);
      setStates(fetchedStates);
      
      if (fetchedStates.length > 0 && !fetchedStates.some((s) => s.isoCode === selectedStateCode)) {
        setSelectedStateCode(fetchedStates[0].isoCode);
      }
    } else {
      setStates([]);
    }
  }, [selectedCountryCode]);

  useEffect(() => {
    if (selectedCountryCode && selectedStateCode) {
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

  const controlStyle = {
    width: '100%',
    padding: '8px 12px', // Matches Mantine input padding sizing
    borderRadius: '4px',
    border: '1px solid #ced4da', // Matches Mantine default border
    fontSize: '14px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: '500', // Bolder font weight matching other inputs
    backgroundColor: '#ffffff',
    color: '#212529', // Crisp dark text color
    boxSizing: 'border-box',
    outline: 'none',
    boxShadow: 'none',
    height: '36px' // Matches Mantine size="sm" control height
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '6px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', width: '100%' }}>
      <div>
        <label style={labelStyle}>Country</label>
        <select
          value={selectedCountryCode}
          onChange={(e) => setSelectedCountryCode(e.target.value)}
          style={controlStyle}
        >
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode} style={{ fontFamily: 'inherit', fontWeight: '500' }}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>State / Province</label>
        <select
          value={selectedStateCode}
          onChange={(e) => setSelectedStateCode(e.target.value)}
          style={controlStyle}
        >
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode} style={{ fontFamily: 'inherit', fontWeight: '500' }}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>City</label>
        {cities.length > 0 ? (
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={controlStyle}
          >
            <option value="" style={{ fontFamily: 'inherit', fontWeight: '500' }}>Select City</option>
            {cities.map((city, idx) => (
              <option key={`${city.name}-${idx}`} value={city.name} style={{ fontFamily: 'inherit', fontWeight: '500' }}>
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
            style={controlStyle}
          />
        )}
      </div>
    </div>
  );
}