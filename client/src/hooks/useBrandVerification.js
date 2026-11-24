import { useState, useEffect, useCallback } from 'react';
import useAuth from './useAuth';
import { getMyBrandProfile } from '../api/brand';

// What an admin has decided about the logged-in brand:
//   'verified' | 'pending' | 'not_verified'
// (null while loading, or when there is no brand profile yet). This is only
// used to decide what to SHOW - the server checks it again on every request,
// so hiding or showing something here can never unlock anything.
//
// One shared copy per login, so the Home page, Profile page, locked screens
// and nav do not each ask the server.
let shared = { userId: null, brand: null, loaded: false, promise: null, at: 0 };
const listeners = new Set();
const MAX_AGE_MS = 60 * 1000;

const publish = () => listeners.forEach((fn) => fn());

const load = (userId, force) => {
  if (shared.userId !== userId) shared = { userId, brand: null, loaded: false, promise: null, at: 0 };
  const fresh = shared.loaded && Date.now() - shared.at < MAX_AGE_MS;
  if (!force && fresh) return Promise.resolve();
  if (shared.promise) return shared.promise;
  const mine = shared;
  mine.promise = getMyBrandProfile()
    .then((res) => { mine.brand = res.data.brand || null; })
    .catch(() => { mine.brand = null; })
    .finally(() => {
      mine.loaded = true;
      mine.at = Date.now();
      mine.promise = null;
      if (shared === mine) publish();
    });
  return mine.promise;
};

// call after something that can change the status (saving the profile, asking again)
export const refreshBrandVerification = () => {
  shared.at = 0;
  window.dispatchEvent(new Event('brandVerificationRefresh'));
};

const useBrandVerification = () => {
  const { user } = useAuth();
  const isBrand = !!user && user.role === 'brand';
  const userId = user ? (user._id || user.id) : null;
  const [, setTick] = useState(0);

  const refresh = useCallback(() => (isBrand ? load(userId, true) : Promise.resolve()), [isBrand, userId]);

  useEffect(() => {
    if (!isBrand) return undefined;
    const rerender = () => setTick((t) => t + 1);
    listeners.add(rerender);
    load(userId, false);
    const onRefresh = () => load(userId, true);
    window.addEventListener('brandVerificationRefresh', onRefresh);
    window.addEventListener('profileCreated', onRefresh);
    return () => {
      listeners.delete(rerender);
      window.removeEventListener('brandVerificationRefresh', onRefresh);
      window.removeEventListener('profileCreated', onRefresh);
    };
  }, [isBrand, userId]);

  if (!isBrand) return { isBrand: false, loading: false, hasProfile: false, status: null, isVerified: false, note: '', brand: null, refresh };

  const mine = shared.userId === userId ? shared : null;
  const loading = !mine || !mine.loaded;
  const brand = mine ? mine.brand : null;
  const raw = brand && brand.verification && brand.verification.status;
  // a brand with no saved status counts as waiting for review
  const status = brand ? (raw === 'verified' || raw === 'not_verified' ? raw : 'pending') : null;

  return {
    isBrand: true,
    loading,
    hasProfile: !!brand,
    status,
    isVerified: status === 'verified',
    note: (brand && brand.verification && brand.verification.note) || '',
    brand,
    refresh,
  };
};

export default useBrandVerification;
