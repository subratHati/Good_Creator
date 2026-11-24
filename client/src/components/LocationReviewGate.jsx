import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { getLocationStatus, saveMyLocation } from '../api/account';
import { matchState, matchCity, stateOfCity, locationProblem } from '../utils/indiaLocations';
import LocationPicker from './LocationPicker';

// Some old profiles have a location we could not match to our state / city lists
// ("India", "Select city", a city in the wrong state ...). The server marks those
// profiles, and this pop-up asks the person to pick a proper location.
//
// It is NOT a one-time message: it comes back on every login and every visit, and
// goes away only once a proper location is saved (the server clears the mark).
// There is no close button - same idea as GenderMigrationModal.
const PAGES_WITHOUT_POPUP = ['/privacy', '/auth'];

const field = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF', boxSizing: 'border-box', color: '#111827' };

// start the pickers on whatever we can recognise in the old text
const startingPoint = (status) => {
  const state = matchState(status.state) || matchState(status.city) || stateOfCity(status.city);
  const city = state ? matchCity(state, status.city) : '';
  return { state, city };
};

const LocationReviewModal = ({ status, onSaved, onLogout }) => {
  const [form, setForm] = useState(() => startingPoint(status));
  const [abroad, setAbroad] = useState(false);
  const [away, setAway] = useState({ city: '', country: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = before; };
  }, []);

  const oldText = [status.city, status.state].map((s) => String(s || '').trim()).filter(Boolean).join(', ');

  const submit = async () => {
    const problem = abroad
      ? (away.city.trim().length < 2 ? 'Please type your city' : away.country.trim().length < 2 ? 'Please type your country' : '')
      : locationProblem(form.state, form.city);
    if (problem) { setError(problem); return; }
    setError('');
    setSaving(true);
    try {
      await saveMyLocation(abroad ? { outsideIndia: true, city: away.city.trim(), state: away.country.trim() } : { state: form.state, city: form.city.trim() });
      toast.success('Thanks! Your location is saved.');
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save, please try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} role="dialog" aria-modal="true" aria-labelledby="loc-review-title" data-testid="location-review-modal">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="px-6 pt-6 pb-4 flex items-start gap-3" style={{ backgroundColor: '#EFF6FF' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#DBEAFE' }}>
            <MapPin size={20} color="#1D4ED8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#1D4ED8' }}>GoodCreator · Quick Update</div>
            <h3 id="loc-review-title" className="font-black text-lg" style={{ color: '#101828' }}>Please set your location</h3>
          </div>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Brands and creators now find each other by state and city, and we could not match the location on your profile{oldText ? <> (<b>{oldText}</b>)</> : null}. Please pick it from the list to continue.
          </p>

          {abroad ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <input type="text" value={away.city} maxLength={60} autoComplete="off" onChange={(e) => setAway({ ...away, city: e.target.value })} placeholder="Your city" style={field} aria-label="City" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                <input type="text" value={away.country} maxLength={60} autoComplete="off" onChange={(e) => setAway({ ...away, country: e.target.value })} placeholder="Your country" style={field} aria-label="Country" />
              </div>
            </div>
          ) : (
            <LocationPicker state={form.state} city={form.city} onChange={(v) => { setForm(v); setError(''); }} required />
          )}

          {error ? <p className="text-sm mt-3" style={{ color: '#B42318' }} role="alert">{error}</p> : null}

          <button type="button" onClick={() => { setAbroad(!abroad); setError(''); }} className="text-xs font-semibold mt-4 underline" style={{ color: '#155DFC' }}>
            {abroad ? 'I live in India - pick from the list' : 'I live outside India'}
          </button>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={submit}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
            style={{ backgroundColor: '#155DFC', boxShadow: saving ? 'none' : '0 3px 0 0 #0c3eb5' }}
          >
            {saving ? 'Saving...' : 'Save and continue'}
          </button>
          <button type="button" onClick={onLogout} className="w-full mt-3 text-xs font-semibold text-gray-500 underline">Log out</button>
        </div>
      </div>
    </div>
  );
};

const LocationReviewGate = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [status, setStatus] = useState(null);
  const userId = user ? (user._id || user.id) : null;
  const role = user ? user.role : null;

  // asked on every page load and every login - the answer lives on the server
  useEffect(() => {
    setStatus(null);
    if (!userId || !['creator', 'brand'].includes(role)) return undefined;
    let alive = true;
    getLocationStatus()
      .then((res) => { if (alive && res.data && res.data.needed) setStatus(res.data); })
      .catch(() => { /* never block the app because this check failed */ });
    return () => { alive = false; };
  }, [userId, role]);

  if (!status || !userId) return null;
  if (PAGES_WITHOUT_POPUP.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return <LocationReviewModal status={status} onSaved={() => setStatus(null)} onLogout={() => { setStatus(null); logout(); }} />;
};

export default LocationReviewGate;
