import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Globe, Search, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { getBrandVerifications, reviewBrandVerification } from '../../api/admin';

const TABS = [
  { key: 'pending', label: 'Waiting' },
  { key: 'not_verified', label: 'Not verified' },
  { key: 'verified', label: 'Verified' },
];

const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';

// how long a brand has been waiting, e.g. "3 hrs", "2 days"
const waiting = (date) => {
  if (!date) return '';
  const ms = Date.now() - new Date(date).getTime();
  if (Number.isNaN(ms) || ms < 0) return '';
  const hour = 3600 * 1000;
  if (ms < hour) return 'less than an hour';
  if (ms < 24 * hour) { const h = Math.floor(ms / hour); return `${h} hr${h === 1 ? '' : 's'}`; }
  const d = Math.floor(ms / (24 * hour));
  return `${d} day${d === 1 ? '' : 's'}`;
};

// wa.me wants the number with the country code and no symbols. A bare
// 10-digit number is an Indian number.
const whatsappLink = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

const BrandCard = ({ brand, tab, busyId, onReview }) => {
  const [note, setNote] = useState(brand.verification?.note || '');
  const [confirming, setConfirming] = useState('');
  const busy = busyId === brand._id;
  const email = brand.userId?.email;
  const rowStyle = { display: 'flex', gap: '8px', fontSize: '13px', alignItems: 'baseline' };
  const labelStyle = { width: '88px', flexShrink: 0, color: '#9CA3AF', fontSize: '12px' };

  const click = (status) => {
    if (status === 'not_verified' && note.trim().length < 3) {
      toast.error('Write a short note first, so the brand knows what to fix');
      return;
    }
    if (confirming !== status) { setConfirming(status); return; }
    setConfirming('');
    onReview(brand, status, note.trim());
  };

  const actionBtn = (status, label, color) => (
    <button
      key={status}
      onClick={() => click(status)}
      disabled={busy}
      className="px-4 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-60"
      style={{ backgroundColor: confirming === status ? '#101828' : color }}
    >
      {busy && confirming === status ? 'Saving...' : confirming === status ? 'Tap again to confirm' : label}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }} data-testid="verification-card">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-black" style={{ backgroundColor: '#155DFC' }}>
          {brand.logo ? <img src={brand.logo} alt="" className="h-full w-full object-cover" /> : (brand.brandName || '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-black text-base" style={{ color: '#101828', overflowWrap: 'anywhere' }}>{brand.brandName}</div>
          <div className="text-xs mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: '#6B7280' }}>
            {brand.category && <span>{brand.category.replace(/_/g, ' ')}</span>}
            {(brand.location?.city || brand.location?.state) && (
              <span className="inline-flex items-center gap-1"><MapPin size={11} />{[brand.location.city, brand.location.state].filter(Boolean).join(', ')}</span>
            )}
          </div>
        </div>
        {tab === 'pending' && (
          <span className="flex-shrink-0 text-xs font-bold rounded-full px-2.5 py-1" style={{ backgroundColor: '#FFFAEB', color: '#B54708', border: '1px solid #FEDF89' }}>
            waiting {waiting(brand.verification?.requestedAt || brand.createdAt)}
          </span>
        )}
      </div>

      {tab === 'pending' && brand.verification?.reason && (
        <div className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold" style={{ backgroundColor: '#FFFAEB', color: '#93370D', border: '1px solid #FEDF89' }} data-testid="verification-reason">
          Was verified before. {brand.verification.reason}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div style={rowStyle}>
          <span style={labelStyle}>Phone</span>
          {brand.phone ? (
            <span className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="font-bold" style={{ color: '#101828' }}>{brand.phone}</span>
              <a href={`tel:${brand.phone}`} className="inline-flex items-center gap-1 text-xs font-bold rounded-lg px-2.5 py-1.5" style={{ backgroundColor: '#EFF6FF', color: '#155DFC' }}><Phone size={12} /> Call</a>
              <a href={whatsappLink(brand.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold rounded-lg px-2.5 py-1.5" style={{ backgroundColor: '#ECFDF3', color: '#067647' }}><MessageCircle size={12} /> WhatsApp</a>
            </span>
          ) : <span style={{ color: '#9CA3AF' }}>Not given (older account)</span>}
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Email</span>
          <span style={{ color: '#101828', overflowWrap: 'anywhere' }}>{email || '—'}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Website</span>
          {brand.website
            ? <a href={brand.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold min-w-0" style={{ color: '#155DFC', overflowWrap: 'anywhere' }}><Globe size={13} className="flex-shrink-0" />{brand.website.replace(/^https?:\/\//, '')}</a>
            : <span style={{ color: '#9CA3AF' }}>Not given</span>}
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Instagram</span>
          {brand.instagram?.handle
            ? <a href={`https://instagram.com/${brand.instagram.handle}`} target="_blank" rel="noreferrer" className="font-semibold" style={{ color: '#155DFC' }}>@{brand.instagram.handle}</a>
            : <span style={{ color: '#9CA3AF' }}>Not given</span>}
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>GSTIN</span>
          <span style={{ color: brand.gstin ? '#101828' : '#9CA3AF', fontWeight: brand.gstin ? 700 : 400, letterSpacing: brand.gstin ? '0.03em' : 0 }}>{brand.gstin || 'Not given'}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>UDYAM</span>
          <span style={{ color: brand.udyam ? '#101828' : '#9CA3AF', fontWeight: brand.udyam ? 700 : 400 }}>{brand.udyam || 'Not given'}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Signed up</span>
          <span style={{ color: '#6B7280' }}>{formatDateTime(brand.createdAt)}</span>
        </div>
        {tab !== 'pending' && brand.verification?.reviewedAt && (
          <div style={rowStyle}>
            <span style={labelStyle}>Reviewed</span>
            <span style={{ color: '#6B7280' }}>{formatDateTime(brand.verification.reviewedAt)}{brand.verification.reviewedBy?.email ? ` by ${brand.verification.reviewedBy.email}` : ''}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <label className="block text-xs font-bold mb-1.5" style={{ color: '#374151' }}>
          Note to the brand <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(needed for "Not verified". The brand reads it.)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => { setNote(e.target.value); setConfirming(''); }}
          rows={2}
          maxLength={500}
          placeholder="e.g. GSTIN does not match the brand name. Please check and send again."
          className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: '#E5E7EB', resize: 'none' }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {tab !== 'verified' && actionBtn('verified', 'Mark verified', '#12B76A')}
        {tab !== 'not_verified' && actionBtn('not_verified', 'Mark not verified', '#D92D20')}
        {tab !== 'pending' && (
          <button
            onClick={() => click('pending')}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
            style={{ backgroundColor: 'white', color: '#344054', border: '1.5px solid #D0D5DD' }}
          >
            {confirming === 'pending' ? 'Tap again to confirm' : 'Move back to waiting'}
          </button>
        )}
      </div>
    </div>
  );
};

const AdminBrandVerification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, not_verified: 0, verified: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState('');
  const reqId = useRef(0);

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/', { replace: true });
  }, [user, navigate]);

  const load = useCallback(async (status, term, pageNum, append) => {
    const mine = ++reqId.current;
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await getBrandVerifications({ status, search: term || undefined, page: pageNum, limit: 20 });
      if (mine !== reqId.current) return; // a newer request replaced this one
      setBrands((prev) => (append ? [...prev, ...res.data.brands] : res.data.brands));
      setCounts(res.data.counts);
      setHasMore(!!res.data.pagination?.hasMore);
      setPage(pageNum);
    } catch (err) {
      if (mine === reqId.current) toast.error(err.response?.data?.message || 'Failed to load brands');
    } finally {
      if (mine === reqId.current) { setLoading(false); setLoadingMore(false); }
    }
  }, []);

  // reload when the tab or the search words change (search waits a moment after typing)
  useEffect(() => {
    const t = setTimeout(() => load(tab, search.trim(), 1, false), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [tab, search, load]);

  const onReview = async (brand, status, note) => {
    setBusyId(brand._id);
    try {
      await reviewBrandVerification(brand._id, { status, note });
      toast.success(
        status === 'verified' ? `${brand.brandName} is now verified`
          : status === 'not_verified' ? `${brand.brandName} marked not verified. They can see your note.`
            : `${brand.brandName} moved back to waiting`
      );
      load(tab, search.trim(), 1, false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save. Please try again.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="sticky top-0 z-20" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} aria-label="Back" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-black text-white">Verify Brands</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
          Call or WhatsApp the brand on the number it gave, check the documents, then mark it verified or not verified.
          Brands are told they will hear from us within 24 hours.
        </p>

        <div className="flex gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold"
              style={{
                backgroundColor: tab === t.key ? '#101828' : 'white',
                color: tab === t.key ? 'white' : '#344054',
                border: '1.5px solid', borderColor: tab === t.key ? '#101828' : '#E5E7EB',
              }}
            >
              {t.label} <span style={{ opacity: 0.7 }}>({counts[t.key] ?? 0})</span>
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand, email, phone, GSTIN..."
            className="w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-3xl mb-2">{tab === 'pending' ? '🎉' : '📭'}</div>
            <div className="text-sm font-black" style={{ color: '#101828' }}>
              {search ? 'No brands match your search' : tab === 'pending' ? 'No brands are waiting' : 'Nothing here yet'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {brands.map((b) => (
              <BrandCard key={`${b._id}-${b.verification?.status}-${b.verification?.reviewedAt}`} brand={b} tab={tab} busyId={busyId} onReview={onReview} />
            ))}
            {hasMore && (
              <button
                onClick={() => load(tab, search.trim(), page + 1, true)}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl text-sm font-bold bg-white border disabled:opacity-60"
                style={{ borderColor: '#E5E7EB', color: '#155DFC' }}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBrandVerification;
