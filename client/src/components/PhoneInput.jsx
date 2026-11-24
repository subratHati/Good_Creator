import { useState } from 'react';
import { COUNTRIES, splitPhone, joinPhone } from '../utils/brandDetails';

// Phone / WhatsApp number with a country code. India (+91) is selected to start with.
//   <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} variant="tailwind" | "inline" />
// `value` and what onChange gives back is the joined number, e.g. +919876543210
// (or '' while the number box is empty).
const STYLES = {
  tailwind: { padding: '12px 14px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', backgroundColor: '#FFFFFF' },
  inline: { padding: '13px 12px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', backgroundColor: '#F9FAFB' },
};

const PhoneInput = ({ value, onChange, variant = 'tailwind', placeholder = '98765 43210', id }) => {
  const base = STYLES[variant] || STYLES.tailwind;
  // the code and the number are kept separately here, so changing the country
  // while the number box is empty does not lose the choice
  const [parts, setParts] = useState(() => splitPhone(value));
  const common = { ...base, outline: 'none', boxSizing: 'border-box', color: '#111827' };
  const focus = (e) => { e.target.style.borderColor = '#155DFC'; };
  const blur = (e) => { e.target.style.borderColor = '#E5E7EB'; };

  const update = (next) => {
    setParts(next);
    onChange(joinPhone(next.code, next.number));
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }} data-testid="phone-input">
      <select
        aria-label="Country code"
        value={parts.code}
        onChange={(e) => update({ ...parts, code: e.target.value })}
        onFocus={focus}
        onBlur={blur}
        style={{ ...common, flex: '0 0 118px', width: '118px', paddingRight: '4px', paddingLeft: '10px' }}
      >
        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>+{c.code} {c.name}</option>)}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={parts.number}
        onChange={(e) => update({ ...parts, number: e.target.value.replace(/[^0-9 \-]/g, '').slice(0, 18) })}
        onFocus={focus}
        onBlur={blur}
        placeholder={placeholder}
        style={{ ...common, flex: '1 1 auto', minWidth: 0, width: '100%' }}
      />
    </div>
  );
};

export default PhoneInput;
