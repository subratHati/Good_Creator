import { useState } from 'react';
import { INDIA_LOCATIONS, STATES, matchState, matchCity } from '../utils/indiaLocations';

// State and city as drop-down lists, so nobody misspells them.
// "My city is not listed" lets a brand type a small town that is not in the list.
//
//   <LocationPicker state={form.state} city={form.city}
//     onChange={({ state, city }) => setForm({ ...form, state, city })}
//     variant="tailwind" | "inline" required />
//
// mode="filter" is for search filters: "All states" / "All cities", nothing is
// required, and there is no "My city is not listed" (a typed city is not a filter).
// hideLabels drops the State / City captions when the page already has its own.
const OTHER = '__other__';

const STYLES = {
  tailwind: {
    label: { display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
    field: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF', boxSizing: 'border-box', color: '#111827' },
    gap: '16px',
  },
  filter: {
    label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' },
    field: { width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF', boxSizing: 'border-box', color: '#111827' },
    gap: '10px',
  },
  inline: {
    label: { display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' },
    field: { width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box', color: '#111827' },
    gap: '14px',
  },
};

const LocationPicker = ({ state, city, onChange, variant = 'tailwind', required = false, mode = 'form', hideLabels = false }) => {
  const isFilter = mode === 'filter';
  const st = STYLES[isFilter ? 'filter' : variant] || STYLES.tailwind;
  const stateValue = matchState(state);
  const cities = INDIA_LOCATIONS[stateValue] || [];
  const cityInList = stateValue ? matchCity(stateValue, city) : '';
  // true when the saved city is not in the list, or the brand chose "not listed"
  const [typing, setTyping] = useState(!isFilter && Boolean(city) && !cityInList);
  const showTextBox = !isFilter && Boolean(stateValue) && (typing || (Boolean(city) && !cityInList));
  // filter mode: a city that is not in the list stays visible instead of silently vanishing
  const extraCity = isFilter && stateValue && city && !cityInList ? String(city) : '';
  const oldStateText = !stateValue && String(state || '').trim();
  const star = required ? <span style={{ color: '#EF4444' }}> *</span> : null;
  const focus = (e) => { e.target.style.borderColor = '#155DFC'; };
  const blur = (e) => { e.target.style.borderColor = variant === 'inline' ? '#E5E7EB' : '#E5E7EB'; };

  const pickState = (e) => {
    setTyping(false);
    onChange({ state: e.target.value, city: '' });
  };
  const pickCity = (e) => {
    if (e.target.value === OTHER) { setTyping(true); onChange({ state: stateValue, city: '' }); return; }
    setTyping(false);
    onChange({ state: stateValue, city: e.target.value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: st.gap }} data-testid="location-picker">
      <div>
        {hideLabels ? null : <label style={st.label}>State{star}</label>}
        <select value={stateValue} onChange={pickState} onFocus={focus} onBlur={blur} style={{ ...st.field, color: stateValue ? '#111827' : '#9CA3AF' }} aria-label="State">
          <option value="">{isFilter ? 'All states' : 'Select state'}</option>
          {STATES.map((s) => <option key={s} value={s} style={{ color: '#111827' }}>{s}</option>)}
        </select>
        {oldStateText && !isFilter ? (
          <p style={{ fontSize: '12px', color: '#B54708', marginTop: '4px' }}>
            "{oldStateText}" is not in our list. Please pick your state from the list.
          </p>
        ) : null}
      </div>
      <div>
        {hideLabels ? null : <label style={st.label}>City{star}</label>}
        <select
          value={showTextBox ? OTHER : (cityInList || extraCity)}
          onChange={pickCity}
          onFocus={focus}
          onBlur={blur}
          disabled={!stateValue}
          style={{ ...st.field, color: (showTextBox || cityInList || extraCity) ? '#111827' : '#9CA3AF', opacity: stateValue ? 1 : 0.6 }}
          aria-label="City"
        >
          <option value="">{stateValue ? (isFilter ? 'All cities' : 'Select city') : (isFilter ? 'Pick a state first' : 'Select state first')}</option>
          {cities.map((c) => <option key={c} value={c} style={{ color: '#111827' }}>{c}</option>)}
          {extraCity ? <option value={extraCity} style={{ color: '#111827' }}>{extraCity}</option> : null}
          {stateValue && !isFilter ? <option value={OTHER} style={{ color: '#111827' }}>My city is not listed</option> : null}
        </select>
        {showTextBox ? (
          <input
            type="text"
            value={city || ''}
            onChange={(e) => onChange({ state: stateValue, city: e.target.value })}
            onFocus={focus}
            onBlur={blur}
            placeholder="Type your city name"
            maxLength={60}
            autoComplete="off"
            style={{ ...st.field, marginTop: '8px' }}
            aria-label="Type your city name"
          />
        ) : null}
      </div>
    </div>
  );
};

export default LocationPicker;
