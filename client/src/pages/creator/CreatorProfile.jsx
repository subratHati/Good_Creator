import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, X, Link2, Landmark, ImagePlay, Tag, Pencil, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import Navbar from '../../components/Navbar';
import BankDetailsForm from '../../components/BankDetailsForm';
import CategoryPolicyDialog from '../../components/CategoryPolicyDialog';
import ImageCropModal from '../../components/ImageCropModal';
import useBackButtonClose from '../../hooks/useBackButtonClose';
import {
  getMyCreatorProfile,
  createCreatorProfile,
  updateCreatorProfile,
  uploadCreatorPhoto,
  getInstagramAuthUrl,
  syncInstagram,
  disconnectInstagram,
} from '../../api/creator';
import toast from 'react-hot-toast';

const CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'finance', 'other'];
const LANGUAGES = ['Hindi', 'English', 'Odia', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Punjabi'];

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const avatarBgs = ['#FF6B35', '#155DFC', '#E1306C', '#16A34A', '#8B5CF6', '#F59E0B'];

const categoryColors = {
  lifestyle: { bg: '#EFF6FF', color: '#1D4ED8' },
  food: { bg: '#FDE68A', color: '#78350F' },
  travel: { bg: '#BBF7D0', color: '#166534' },
  fashion: { bg: '#DDD6FE', color: '#4C1D95' },
  beauty: { bg: '#FBCFE8', color: '#831843' },
  tech: { bg: '#BFDBFE', color: '#1E3A8A' },
  fitness: { bg: '#BBF7D0', color: '#166534' },
  gaming: { bg: '#DDD6FE', color: '#4C1D95' },
  education: { bg: '#FDE68A', color: '#78350F' },
  finance: { bg: '#BBF7D0', color: '#166534' },
  other: { bg: '#F3F4F6', color: '#374151' },
};

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <button type="button" onClick={() => onChange(!value)}
    style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: value ? '#155DFC' : '#D1D5DB', transition: 'background-color 0.2s', padding: 0 }}>
    <span style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s', display: 'block' }} />
  </button>
);

// ─── PROFILE DETAILS MODAL ────────────────────────────────────────────────────
const ProfileDetailsModal = ({ profile, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    city: profile?.location?.city || '',
    state: profile?.location?.state || '',
    categories: profile?.categories || [],
  });
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(profile?.profilePhoto || null);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  // raw picked file waiting to be cropped, shown in ImageCropModal
  const [rawImageForCrop, setRawImageForCrop] = useState(null);

  useBackButtonClose(true, onClose);

  const toggleCategory = (cat) => {
    setForm(prev => {
      const alreadySelected = prev.categories.includes(cat);
      if (!alreadySelected && prev.categories.length >= 3) {
        setShowPolicyDialog(true);
        return prev;
      }
      return {
        ...prev,
        categories: alreadySelected ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat],
      };
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // don't upload the raw picked file — open the crop modal first, so the
    // creator can position/zoom into a square before anything gets sent
    setRawImageForCrop(URL.createObjectURL(file));
    // reset the input so picking the same file again still fires onChange
    e.target.value = '';
  };

  const handleCropDone = async (croppedBlob) => {
    setRawImageForCrop(null);
    setPhotoPreview(URL.createObjectURL(croppedBlob));
    const formData = new FormData();
    formData.append('profilePhoto', croppedBlob, 'profile-photo.jpg');
    setPhotoUploading(true);
    try { await uploadCreatorPhoto(formData); toast.success('Photo uploaded'); }
    catch { toast.error('Photo upload failed'); }
    finally { setPhotoUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.city.trim()) return toast.error('City is required');
    if (!form.state.trim()) return toast.error('State is required');
    if (form.categories.length < 1) return toast.error('Select at least 1 category');
    if (form.categories.length > 3) return setShowPolicyDialog(true);
    setSaving(true);
    try {
      const payload = { name: form.name, bio: form.bio, location: { city: form.city, state: form.state }, categories: form.categories };
      if (profile) await updateCreatorProfile(payload);
      else await createCreatorProfile(payload);
      toast.success('Profile saved!');
      onSave(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const bgColor = avatarBgs[(form.name?.charCodeAt(0) || 0) % avatarBgs.length];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg overflow-y-auto profile-modal-content" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <style>{`
          @media (max-width: 767px) {
            .profile-modal-content { padding-bottom: calc(60px + env(safe-area-inset-bottom) + 16px); }
          }
        `}</style>
        <div className="p-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
          <h3 className="font-black text-gray-900 text-lg mb-5">Edit Profile Details</h3>

          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden relative" style={{ backgroundColor: bgColor }}>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="profile"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                  />
                ) : (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '20px' }}>
                    {form.name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer" style={{ border: '2px solid white' }}>
                <Camera size={10} className="text-white" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <div className="text-xs text-gray-400">{photoUploading ? 'Uploading...' : 'Tap camera to change photo'}</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Bhubaneswar"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Odisha"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Categories <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(select 1-3, selected: {form.categories.length})</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const isSelected = form.categories.includes(cat);
                  const isDisabled = !isSelected && form.categories.length >= 3;
                  return (
                    <button key={cat} type="button" onClick={() => toggleCategory(cat)} disabled={isDisabled}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border capitalize transition-all ${isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isDisabled
                          ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300'
                        }`}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Bio <span className="text-gray-400 font-normal">(optional, max 300)</span></label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} maxLength={300} rows={3}
                placeholder="Tell brands about yourself..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              <div className="text-xs text-gray-400 text-right mt-0.5">{form.bio.length}/300</div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60" style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
      {showPolicyDialog && (
        <CategoryPolicyDialog mode="blocked" onClose={() => setShowPolicyDialog(false)} />
      )}
      {rawImageForCrop && (
        <ImageCropModal
          imageSrc={rawImageForCrop}
          onCancel={() => setRawImageForCrop(null)}
          onCropDone={handleCropDone}
        />
      )}
    </div>
  );
};

// ─── RATE CHART MODAL ─────────────────────────────────────────────────────────
const RateChartModal = ({ profile, onClose, onSave }) => {
  const [form, setForm] = useState({
    pricing: {
      reel: profile?.pricing?.reel || '',
      post: profile?.pricing?.post || '',
      story: profile?.pricing?.story || '',
      ugcCollab: profile?.pricing?.ugcCollab || '',
      ugcNonCollab: profile?.pricing?.ugcNonCollab || '',
    },
    languages: profile?.languages || [],
    barterEnabled: profile?.barterEnabled || false,
    isOpenForCollab: profile?.isOpenForCollab ?? true,
    sampleContentLinks: profile?.sampleContentLinks?.length ? profile.sampleContentLinks : [''],
  });
  const [saving, setSaving] = useState(false);

  useBackButtonClose(true, onClose);

  const toggleLanguage = (lang) => setForm(prev => ({
    ...prev, languages: prev.languages.includes(lang) ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang],
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCreatorProfile({
        pricing: {
          reel: Number(form.pricing.reel) || 0,
          post: Number(form.pricing.post) || 0,
          story: Number(form.pricing.story) || 0,
          ugcCollab: Number(form.pricing.ugcCollab) || 0,
          ugcNonCollab: Number(form.pricing.ugcNonCollab) || 0,
        },
        languages: form.languages,
        barterEnabled: form.barterEnabled,
        isOpenForCollab: form.isOpenForCollab,
        sampleContentLinks: form.sampleContentLinks.filter(l => l.trim()),
      });
      toast.success('Rate chart saved!');
      onSave(); onClose();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg overflow-y-auto rate-modal-content" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <style>{`
          @media (max-width: 767px) {
            .rate-modal-content { padding-bottom: calc(60px + env(safe-area-inset-bottom) + 16px); }
          }
        `}</style>
        <div className="p-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
          <h3 className="font-black text-gray-900 text-lg mb-5">Edit Rate Chart</h3>
          <div className="space-y-5">
            <div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Content Pricing (₹)</div>
              <div className="space-y-3">
                {[
                  { key: 'reel', label: '🎬 Reel' },
                  { key: 'post', label: '📷 Feed Post' },
                  { key: 'story', label: '⏱ Story' },
                  { key: 'ugcCollab', label: '🎥 UGC with collab tag' },
                  { key: 'ugcNonCollab', label: '🎥 UGC without collab tag' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1 text-sm font-semibold text-gray-700">{label}</div>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input type="number" value={form.pricing[key]}
                        onChange={e => setForm({ ...form, pricing: { ...form.pricing, [key]: e.target.value } })}
                        placeholder="0" min="0"
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Availability</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Open for collaboration</span>
                  <Toggle value={form.isOpenForCollab} onChange={v => setForm({ ...form, isOpenForCollab: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Open to barter</span>
                  <Toggle value={form.barterEnabled} onChange={v => setForm({ ...form, barterEnabled: v })} />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Content Languages</div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${form.languages.includes(lang) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sample Content Links (max 5)</div>
              <div className="space-y-2">
                {form.sampleContentLinks.map((link, i) => (
                  <input key={i} type="url" value={link}
                    onChange={e => { const updated = [...form.sampleContentLinks]; updated[i] = e.target.value; setForm({ ...form, sampleContentLinks: updated }); }}
                    placeholder="https://www.instagram.com/p/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                ))}
                {form.sampleContentLinks.length < 5 && (
                  <button type="button" onClick={() => setForm({ ...form, sampleContentLinks: [...form.sampleContentLinks, ''] })}
                    className="text-sm font-bold hover:underline" style={{ color: '#155DFC' }}>+ Add link</button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60" style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}>
              {saving ? 'Saving...' : 'Save Rates'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AVATAR COMPONENT ─────────────────────────────────────────────────────────
const Avatar = ({ name, photo, size = 80, borderColor, borderWidth = 3, extraShadow }) => {
  const bg = avatarBgs[(name?.charCodeAt(0) || 0) % avatarBgs.length];
  const resolvedBorderColor = borderColor || `${bg}33`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        border: `${borderWidth}px solid ${resolvedBorderColor}`,
        boxSizing: 'border-box',
        boxShadow: extraShadow,
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt={name}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
      ) : (
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 900, color: 'white', lineHeight: 1 }}>
          {name?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
};

// ─── EDIT BUTTON ──────────────────────────────────────────────────────────────
const EditBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ backgroundColor: '#EFF6FF', color: '#155DFC', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>
    Edit
  </button>
);

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, onEdit, locked, children }) => (
  <div style={{ backgroundColor: 'white', border: '1.5px solid #F0F0F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 3px 0 0 #E5E5E5', opacity: locked ? 0.5 : 1 }}>
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 900, fontSize: '14px', color: '#101828' }}>{title}</span>
      {!locked && onEdit && <EditBtn onClick={onEdit} />}
      {locked && <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Complete profile first</span>}
    </div>
    <div style={{ padding: '14px 16px' }}>{children}</div>
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const CreatorProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // TEMPORARY: nags creators who already have more than 3 categories from
  // before the new policy existed. Remove this whole block once migrated.
  const [showOverLimitDialog, setShowOverLimitDialog] = useState(false);


  const fetchProfile = async () => {
    try { const res = await getMyCreatorProfile(); setProfile(res.data.creator); }
    catch { setProfile(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  // TEMPORARY(start): show the over-limit policy dialog every time an existing
  // creator with more than 3 categories loads their profile. Remove once
  // all legacy over-limit accounts have been migrated.
  useEffect(() => {
    if (profile?.categories?.length > 3) {
      setShowOverLimitDialog(true);
    }
  }, [profile]);

  //All the above code piece are TEMPORARY(end) till all the old creators change there category range from more than 3 to 1-3.

  const handleInstagramConnect = async () => {
    try { const res = await getInstagramAuthUrl(); window.location.href = res.data.url; }
    catch { toast.error('Failed to get auth URL'); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try { await syncInstagram(); toast.success('Instagram synced!'); fetchProfile(); }
    catch { toast.error('Sync failed'); }
    finally { setSyncing(false); }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectInstagram();
      toast.success('Instagram disconnected');
      setShowDisconnectConfirm(false);
      // immediately clear instagram stats from local state
      setProfile(prev => prev ? {
        ...prev,
        instagram: {
          isConnected: false,
          handle: null,
          followersCount: 0,
          engagementRate: null,
          avgViews: 0,
          avgLikes: 0,
          avgComments: 0,
          avgShares: 0,
          avgReach: 0,
        }
      } : prev);
      fetchProfile();
    } catch { toast.error('Failed to disconnect'); }
  };

  const hasProfile = !!profile;
  const engGood = (profile?.instagram?.engagementRate || 0) >= 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      </div>
    );
  }

  // ── shared sections ──
  const CategoriesSection = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {profile?.categories?.length
        ? profile.categories.map(cat => {
          const cs = categoryColors[cat] || categoryColors.other;
          return <span key={cat} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', backgroundColor: cs.bg, color: cs.color, textTransform: 'capitalize' }}>{cat}</span>;
        })
        : <span style={{ fontSize: '12px', color: '#9CA3AF' }}>No categories set</span>
      }
    </div>
  );

  const RateChartSection = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      {[
        { key: 'reel', label: '🎬 Reel' },
        { key: 'post', label: '📷 Post' },
        { key: 'story', label: '⏱ Story' },
        { key: 'ugcCollab', label: '🎥 UGC' },
      ].map(({ key, label }) => (
        <div key={key} style={{ backgroundColor: '#F8FAFF', border: '1.5px solid #DBEAFE', borderRadius: '12px', padding: '10px' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: profile?.pricing?.[key] > 0 ? '#155DFC' : '#D1D5DB' }}>
            {profile?.pricing?.[key] > 0 ? `₹${profile.pricing[key].toLocaleString('en-IN')}` : 'Not set'}
          </div>
        </div>
      ))}
    </div>
  );

  const InstagramSection = () => (
    hasProfile ? (
      profile?.instagram?.isConnected ? (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1, backgroundColor: '#FACC15', borderRadius: '12px', padding: '10px', textAlign: 'center', boxShadow: '0 2px 0 0 #B45309' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{formatNumber(profile.instagram.followersCount)}</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#78350F', textTransform: 'uppercase', marginTop: '2px' }}>Followers</div>
            </div>
            <div style={{ flex: 1, backgroundColor: engGood ? '#DCFCE7' : '#FEE2E2', borderRadius: '12px', padding: '10px', textAlign: 'center', boxShadow: engGood ? '0 2px 0 0 #86EFAC' : '0 2px 0 0 #FCA5A5' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: engGood ? '#14532D' : '#7F1D1D' }}>{profile.instagram.engagementRate ? `${profile.instagram.engagementRate}%` : '—'}</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: engGood ? '#166534' : '#991B1B', textTransform: 'uppercase', marginTop: '2px' }}>Engagement</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '10px', textAlign: 'center', boxShadow: '0 2px 0 0 #BFDBFE' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E3A8A' }}>{formatNumber(profile.instagram.avgViews)}</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', marginTop: '2px' }}>Avg Views</div>
            </div>
          </div>
          {showDisconnectConfirm ? (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontWeight: 900, fontSize: '13px', color: '#7F1D1D', marginBottom: '4px' }}>Disconnect Instagram?</div>
              <div style={{ fontSize: '12px', color: '#DC2626', marginBottom: '12px' }}>Your verified stats will be removed from your profile.</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowDisconnectConfirm(false)} style={{ flex: 1, padding: '8px', border: '1px solid #E5E7EB', backgroundColor: 'white', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDisconnect} style={{ flex: 1, padding: '8px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 2px 0 0 #991B1B' }}>Disconnect</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSync} disabled={syncing} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '12px', fontSize: '12px', fontWeight: 900, color: '#155DFC', cursor: 'pointer' }}>
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button onClick={() => setShowDisconnectConfirm(true)} style={{ padding: '9px 16px', backgroundColor: '#FEE2E2', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 900, color: '#DC2626', cursor: 'pointer' }}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '10px', marginBottom: '12px' }}>
            Connect Instagram to show verified followers, engagement and avg views to brands.
          </p>
          <button onClick={handleInstagramConnect} style={{ width: '100%', padding: '12px', background: 'linear-gradient(90deg,#833AB4,#E1306C,#F77737)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}>
            Connect Instagram →
          </button>
        </div>
      )
    ) : null
  );

  const SampleContentSection = () => (
    <div>
      {profile?.sampleContentLinks?.filter(l => l).length > 0
        ? profile.sampleContentLinks.filter(l => l).map((link, i) => (
          <a key={i} href={link} target="_blank" rel="noreferrer"
            style={{ display: 'block', fontSize: '12px', color: '#155DFC', padding: '8px 12px', backgroundColor: '#F8FAFF', borderRadius: '10px', marginBottom: '6px', border: '1px solid #DBEAFE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Link2 size={12} style={{ marginRight: '6px', flexShrink: 0 }} /> {link}
          </a>
        ))
        : <p style={{ fontSize: '12px', color: '#9CA3AF' }}>No sample content links added yet.</p>
      }
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F7', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto md:px-6 md:py-6 pb-24 md:pb-10" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="px-4 md:px-0">
            {/* spacer for desktop only */}
          </div>

          {!hasProfile && (
            <div className="px-4 md:px-0" style={{ marginBottom: '0' }}>
              <div style={{ backgroundColor: '#FEF9C3', border: '1.5px solid #FDE047', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>
                  <AlertCircle size={20} color="#78350F" style={{ flexShrink: 0 }} />
                </span>
                <div>
                  <div style={{ fontWeight: 900, color: '#78350F', fontSize: '13px', marginBottom: '2px' }}>Complete your profile to get started</div>
                  <div style={{ fontSize: '12px', color: '#92400E' }}>Fill in your basic details to unlock all features and get discovered by brands.</div>
                </div>
              </div>
            </div>
          )}

          {/* ── MOBILE LAYOUT — Stitch style ── */}
          <div className="md:hidden px-4">

            {/* full-bleed gradient header */}
            <div style={{ margin: '-24px -16px 0', height: '200px', background: '#101828', position: 'relative', overflow: 'hidden' }}>
              {/* decorative blobs */}
              <div style={{ position: 'absolute', top: '20px', left: '20px', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)', filter: 'blur(20px)' }} />
              <div style={{ position: 'absolute', bottom: '10px', right: '20px', width: '140px', height: '140px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', filter: 'blur(30px)' }} />
            </div>

            {/* glassmorphism profile card — floats over gradient */}
            <div style={{ margin: '-80px 0 0', position: 'relative', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '24px', padding: '0 20px 20px', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.08)', marginBottom: '16px' }}>

              {/* avatar — centered, overlapping gradient */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', marginTop: '-40px', marginBottom: '12px' }}>
                  <Avatar name={profile?.name} photo={profile?.profilePhoto} size={80} borderColor="white" borderWidth={4} extraShadow="0 4px 12px rgba(0,0,0,0.15)" />
                  <button onClick={() => setModal('profile')}
                    style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', backgroundColor: '#BE0038', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Camera size={10} color="white" />
                  </button>
                </div>

                <div style={{ fontWeight: 900, fontSize: '20px', color: '#1C1B1B', marginBottom: '2px' }}>{profile?.name || 'Your Name'}</div>

                {profile?.instagram?.isConnected && profile?.instagram?.handle && (
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#155DFC', marginBottom: '4px' }}>
                    @{profile.instagram.handle}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#906F70', marginBottom: '16px' }}>
                  {profile?.location?.city ? `${profile.location.city}, ${profile.location.state}` : 'No location set'}
                </div>

                {/* big stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', marginBottom: '14px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#BE0038' }}>{formatNumber(profile?.instagram?.followersCount) || '—'}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#906F70', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Followers</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#008563' }}>{profile?.instagram?.engagementRate ? `${profile.instagram.engagementRate}%` : '—'}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#906F70', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Engagement</div>
                  </div>
                </div>


                {/* open badge */}
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '16px' }}>
                  <div style={{ flex: 1, backgroundColor: profile?.isOpenForCollab ? '#DCFCE7' : '#F3F4F6', borderRadius: '10px', padding: '7px', textAlign: 'center', border: '1px solid ' + (profile?.isOpenForCollab ? '#BBF7D0' : '#E5E7EB') }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: profile?.isOpenForCollab ? '#166534' : '#6B7280' }}>
                      {profile?.isOpenForCollab ? '✓ Open for Collab' : '✗ Closed'}
                    </span>
                  </div>
                  {profile?.barterEnabled && (
                    <div style={{ flex: 1, backgroundColor: '#FEF9C3', borderRadius: '10px', padding: '7px', textAlign: 'center', border: '1px solid #FDE047' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#854D0E' }}>Barter ✓</span>
                    </div>
                  )}
                </div>

                <button onClick={() => setModal('profile')}
                  style={{ width: '100%', padding: '11px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 0 0 #0C3EB5' }}>
                  <Pencil size={14} style={{ marginRight: '6px' }} /> Edit Profile Details
                </button>
              </div>
            </div>

            {/* Instagram insights card — dark like Stitch */}
            <div style={{ backgroundColor: '#1C1B1B', borderRadius: '20px', padding: '16px', marginBottom: '16px', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: profile?.instagram?.isConnected ? '14px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <circle cx="12" cy="12" r="4" />
                        <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '14px', color: 'white' }}>Instagram Insights</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                      {profile?.instagram?.isConnected ? 'Connected · tap sync to refresh' : 'Not connected'}
                    </div>
                  </div>
                </div>
                {profile?.instagram?.isConnected && (
                  <button onClick={handleSync} disabled={syncing}
                    style={{ backgroundColor: '#00FFCC', color: '#000', border: 'none', borderRadius: '20px', padding: '7px 16px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'SYNC...' : 'SYNC'}
                  </button>
                )}
              </div>

              {profile?.instagram?.isConnected ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                    {[
                      { label: 'Followers', value: formatNumber(profile.instagram.followersCount), bg: '#FACC15', color: '#0F172A', shadow: '#B45309' },
                      { label: 'Avg Reach', value: formatNumber(profile.instagram.avgReach), bg: '#FFF7ED', color: '#92400E', shadow: '#FDE68A' },
                      { label: 'Avg Views', value: formatNumber(profile.instagram.avgViews), bg: '#EFF6FF', color: '#1E3A8A', shadow: '#BFDBFE' },
                      { label: 'Avg Likes', value: formatNumber(profile.instagram.avgLikes), bg: '#FDF2F8', color: '#831843', shadow: '#FBCFE8' },
                      { label: 'Avg Comments', value: formatNumber(profile.instagram.avgComments), bg: '#F0FDF4', color: '#14532D', shadow: '#BBF7D0' },
                      { label: 'Avg Shares', value: formatNumber(profile.instagram.avgShares), bg: '#F5F3FF', color: '#4C1D95', shadow: '#DDD6FE' },
                    ].map((s, i) => (
                      <div key={i} style={{ backgroundColor: s.bg, borderRadius: '10px', padding: '8px 4px', textAlign: 'center', boxShadow: `0 2px 0 0 ${s.shadow}` }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '7px', fontWeight: 700, color: s.color, textTransform: 'uppercase', marginTop: '3px', opacity: 0.7 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {showDisconnectConfirm ? (
                    <div style={{ backgroundColor: '#3B1515', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontWeight: 900, fontSize: '13px', color: '#FCA5A5', marginBottom: '4px' }}>Disconnect Instagram?</div>
                      <div style={{ fontSize: '12px', color: '#F87171', marginBottom: '12px' }}>Your verified stats will be removed.</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setShowDisconnectConfirm(false)} style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: 'white', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleDisconnect} style={{ flex: 1, padding: '8px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>Disconnect</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowDisconnectConfirm(true)} style={{ width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                      Disconnect Instagram
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={handleInstagramConnect} style={{ width: '100%', padding: '12px', background: 'linear-gradient(90deg,#833AB4,#E1306C,#F77737)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', marginTop: '12px' }}>
                  Connect Instagram
                </button>
              )}
            </div>

            {/* categories */}
            <SectionCard title="Categories" onEdit={() => setModal('profile')}>
              <CategoriesSection />
            </SectionCard>

            {/* rate chart — white card with border like Stitch */}
            <div style={{ backgroundColor: 'white', border: '2px solid #E5BDBE', borderRadius: '20px', padding: '16px', marginTop: '16px', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} style={{ marginRight: '8px' }} /> Rate Chart
                </div>
                {hasProfile && (
                  <button onClick={() => setModal('rates')} style={{ backgroundColor: '#EFF6FF', color: '#155DFC', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>
                    Edit
                  </button>
                )}
              </div>
              {hasProfile ? <RateChartSection /> : <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Complete your profile first</div>}
            </div>

            {/* bank details — gray bg like Stitch */}
            <SectionCard title="Bank Details" onEdit={hasProfile ? () => navigate('/creator/bank-details') : undefined} locked={!hasProfile}>
              <button
                onClick={() => navigate('/creator/bank-details')}
                disabled={!hasProfile}
                style={{ width: '100%', padding: '12px', backgroundColor: '#F8FAFC', border: '1.5px dashed #E5E7EB', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#155DFC', cursor: hasProfile ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Landmark size={16} style={{ marginRight: '8px' }} /> Manage Bank Account
              </button>
            </SectionCard>

            {/* bio / the vibe — yellow like Stitch */}
            {hasProfile && profile?.bio && (
              <div style={{ backgroundColor: '#FCC82B', borderRadius: '20px', padding: '16px', marginTop: '16px', border: '2px solid #765B00', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Sparkles size={18} style={{ marginRight: '8px' }} /> The Vibe
                </div>
                <p style={{ fontSize: '14px', color: '#251A00', lineHeight: '1.6', fontWeight: 400 }}>{profile.bio}</p>
              </div>
            )}

            {/* sample content */}
            <div style={{ marginTop: '16px' }}>
              <SectionCard title="Sample Content" onEdit={hasProfile ? () => setModal('rates') : undefined} locked={!hasProfile}>
                {hasProfile && <SampleContentSection />}
              </SectionCard>
            </div>

          </div>

          {/* ── DESKTOP LAYOUT ── */}
          <div className="hidden md:flex gap-6 items-start px-4 md:px-0">

            {/* LEFT — sticky profile card */}
            <div style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '90px' }}>
              <div style={{ backgroundColor: '#101828', borderRadius: '24px', padding: '24px 20px', boxShadow: '0 6px 0 0 #0a1020', textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
                  <Avatar name={profile?.name} photo={profile?.profilePhoto} size={90} />
                  <button onClick={() => setModal('profile')} style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', backgroundColor: '#155DFC', borderRadius: '50%', border: '2px solid #101828', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Camera size={11} color="white" />
                  </button>
                </div>
                <div style={{ fontWeight: 900, fontSize: '18px', color: 'white', marginBottom: '2px' }}>{profile?.name || 'Your Name'}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '18px' }}>
                  {profile?.instagram?.isConnected && profile?.instagram?.handle && (
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#93B4FD', marginBottom: '4px' }}>
                      @{profile.instagram.handle}
                    </div>
                  )}
                  {profile?.location?.city ? `${profile.location.city}, ${profile.location.state}` : 'No location set'}
                </div>

                {/* followers big */}
                <div style={{ backgroundColor: '#FACC15', borderRadius: '14px', padding: '12px', marginBottom: '8px', boxShadow: '0 3px 0 0 #B45309' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A' }}>{formatNumber(profile?.instagram?.followersCount)}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#78350F', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Followers</div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, backgroundColor: engGood ? '#DCFCE7' : '#FEE2E2', borderRadius: '12px', padding: '10px 6px', boxShadow: engGood ? '0 2px 0 0 #86EFAC' : '0 2px 0 0 #FCA5A5' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: engGood ? '#14532D' : '#7F1D1D' }}>{profile?.instagram?.engagementRate ? `${profile.instagram.engagementRate}%` : '—'}</div>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: engGood ? '#166534' : '#991B1B', textTransform: 'uppercase', marginTop: '2px' }}>Engage</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '10px 6px', boxShadow: '0 2px 0 0 #BFDBFE' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E3A8A' }}>{formatNumber(profile?.instagram?.avgViews)}</div>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', marginTop: '2px' }}>Avg Views</div>
                  </div>
                </div>

                <div style={{ backgroundColor: profile?.isOpenForCollab ? '#DCFCE7' : '#F3F4F6', borderRadius: '10px', padding: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: profile?.isOpenForCollab ? '#166534' : '#6B7280' }}>
                    {profile?.isOpenForCollab ? '✓ Open for Collab' : '✗ Closed for Collab'}
                  </span>
                </div>
                <div style={{ background: profile?.instagram?.isConnected ? 'linear-gradient(90deg,#833AB4,#E1306C)' : '#F3F4F6', borderRadius: '10px', padding: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: profile?.instagram?.isConnected ? 'white' : '#9CA3AF' }}>
                    {profile?.instagram?.isConnected ? `📸 @${profile.instagram.handle}` : 'Instagram not connected'}
                  </span>
                </div>

                <button onClick={() => setModal('profile')} style={{ width: '100%', padding: '10px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 3px 0 0 #0c3eb5' }}>
                  ✎ Edit Profile
                </button>
              </div>
            </div>

            {/* RIGHT — sections */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <SectionCard title="Categories" onEdit={() => setModal('profile')}>
                <CategoriesSection />
              </SectionCard>

              <SectionCard title="Instagram & Stats">
                <InstagramSection />
              </SectionCard>

              <SectionCard title="Rate Chart" onEdit={hasProfile ? () => setModal('rates') : undefined} locked={!hasProfile}>
                {hasProfile && <RateChartSection />}
              </SectionCard>

              <SectionCard title="Bank Details" locked={!hasProfile}>
                {hasProfile && (
                  <button
                    onClick={() => navigate('/creator/bank-details')}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#F8FAFC', border: '1.5px dashed #E5E7EB', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#155DFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    🏦 Manage Bank Account
                  </button>
                )}
              </SectionCard>

              <SectionCard title="Sample Content" onEdit={hasProfile ? () => setModal('rates') : undefined} locked={!hasProfile}>
                {hasProfile && <SampleContentSection />}
              </SectionCard>

            </div>
          </div>

        </div>
      </div>

      {modal === 'profile' && <ProfileDetailsModal profile={profile} onClose={() => setModal(null)} onSave={fetchProfile} />}
      {modal === 'rates' && hasProfile && <RateChartModal profile={profile} onClose={() => setModal(null)} onSave={fetchProfile} />}

      {showOverLimitDialog && (
        <CategoryPolicyDialog
          mode="existing"
          currentCount={profile?.categories?.length}
          onFixNow={() => {
            setShowOverLimitDialog(false);
            setModal('profile');
          }}
        />
      )}
    </div>
  );
};

export default CreatorProfile;
