import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Edit2, Lock, RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar';
import BankDetailsForm from '../../components/BankDetailsForm';
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

// ─── MODALS ───────────────────────────────────────────────────────────────────

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

  const toggleCategory = (cat) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('profilePhoto', file);
    setPhotoUploading(true);
    try {
      await uploadCreatorPhoto(formData);
      toast.success('Photo uploaded');
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.city.trim()) return toast.error('City is required');
    if (!form.state.trim()) return toast.error('State is required');
    if (form.categories.length < 3) return toast.error('Select at least 3 categories');

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        location: { city: form.city, state: form.state },
        categories: form.categories,
      };
      if (profile) {
        await updateCreatorProfile(payload);
      } else {
        await createCreatorProfile(payload);
      }
      toast.success('Profile saved!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg overflow-y-auto"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
          <h3 className="font-bold text-gray-900 text-lg mb-5">Edit Profile Details</h3>

          {/* photo */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                {photoPreview
                  ? <img src={photoPreview} alt="profile" className="w-full h-full object-cover" />
                  : form.name?.[0]?.toUpperCase() || '?'
                }
              </div>
              <label className="absolute bottom-0 right-0 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer">
                <Camera size={10} className="text-white" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <div className="text-xs text-gray-400">{photoUploading ? 'Uploading...' : 'Tap camera to change photo'}</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Bhubaneswar"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Odisha"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(min 3, selected: {form.categories.length})</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                      form.categories.includes(cat) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >{cat}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio <span className="text-gray-400 font-normal">(optional, max 300)</span>
              </label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} maxLength={300} rows={3}
                placeholder="Tell brands about yourself..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              <div className="text-xs text-gray-400 text-right mt-0.5">{form.bio.length}/300</div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const toggleLanguage = (lang) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang) ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang],
    }));
  };

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
      onSave();
      onClose();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ value, onChange }) => (
    <button type="button" onClick={() => onChange(!value)}
      style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: value ? '#2563EB' : '#D1D5DB', transition: 'background-color 0.2s', padding: 0 }}>
      <span style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s', display: 'block' }} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
          <h3 className="font-bold text-gray-900 text-lg mb-5">Edit Rate Chart</h3>

          <div className="space-y-5">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Content Pricing (₹)</div>
              <div className="space-y-3">
                {[
                  { key: 'reel', label: '🎬 Reel' },
                  { key: 'post', label: '📷 Feed Post' },
                  { key: 'story', label: '⏱ Story' },
                  { key: 'ugcCollab', label: '🎥 UGC with collab tag' },
                  { key: 'ugcNonCollab', label: '🎥 UGC without collab tag' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1 text-sm text-gray-700">{label}</div>
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
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Availability</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Open for collaboration</span>
                  <Toggle value={form.isOpenForCollab} onChange={v => setForm({ ...form, isOpenForCollab: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Open to barter</span>
                  <Toggle value={form.barterEnabled} onChange={v => setForm({ ...form, barterEnabled: v })} />
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Content Languages</div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.languages.includes(lang) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'
                    }`}
                  >{lang}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sample Content Links (max 5)</div>
              <div className="space-y-2">
                {form.sampleContentLinks.map((link, i) => (
                  <input key={i} type="url" value={link}
                    onChange={e => {
                      const updated = [...form.sampleContentLinks];
                      updated[i] = e.target.value;
                      setForm({ ...form, sampleContentLinks: updated });
                    }}
                    placeholder="https://www.instagram.com/p/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                ))}
                {form.sampleContentLinks.length < 5 && (
                  <button type="button" onClick={() => setForm({ ...form, sampleContentLinks: [...form.sampleContentLinks, ''] })}
                    className="text-sm text-blue-600 font-medium hover:underline">
                    + Add link
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Rates'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────────

const SectionCard = ({ title, subtitle, icon, locked, onClick, children }) => (
  <div
    onClick={locked ? undefined : onClick}
    className={`bg-white rounded-2xl border border-gray-200 p-5 transition-all ${
      locked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
    }`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">{title}</div>
          <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
        </div>
      </div>
      {locked
        ? <Lock size={16} className="text-gray-300" />
        : <Edit2 size={16} className="text-gray-400" />
      }
    </div>
    {children}
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

  const fetchProfile = async () => {
    try {
      const res = await getMyCreatorProfile();
      setProfile(res.data.creator);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleInstagramConnect = async () => {
    try {
      const res = await getInstagramAuthUrl();
      window.location.href = res.data.url;
    } catch {
      toast.error('Failed to get auth URL');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncInstagram();
      toast.success('Instagram synced!');
      fetchProfile();
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectInstagram();
      toast.success('Instagram disconnected');
      setShowDisconnectConfirm(false);
      fetchProfile();
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const hasProfile = !!profile;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-4">

        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your creator profile and settings</p>
        </div>

        {!hasProfile && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="text-xl flex-shrink-0">⚠️</div>
            <div>
              <div className="font-semibold text-amber-900 text-sm">Complete your profile to get started</div>
              <div className="text-xs text-amber-700 mt-0.5">Fill in your basic details below to unlock all features and get discovered by brands.</div>
            </div>
          </div>
        )}

        {/* SECTION 1: PROFILE DETAILS */}
        <SectionCard
          title="Profile Details"
          subtitle={hasProfile ? `${profile.name} · ${profile.location?.city || 'No city'}` : 'Tap to set up your profile'}
          icon="👤"
          locked={false}
          onClick={() => setModal('profile')}
        >
          {hasProfile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {profile.profilePhoto
                    ? <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
                    : profile.name?.[0]?.toUpperCase()
                  }
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{profile.name}</div>
                  <div className="text-xs text-gray-400">{profile.location?.city}, {profile.location?.state}</div>
                  {profile.bio && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{profile.bio}</div>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.categories?.map(cat => (
                  <span key={cat} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 capitalize font-medium">{cat}</span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${profile.isOpenForCollab ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${profile.isOpenForCollab ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {profile.isOpenForCollab ? 'Open for collab' : 'Closed'}
                </span>
                {profile.barterEnabled && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Barter ✓</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Not set up yet</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Required →</span>
            </div>
          )}
        </SectionCard>

        {/* SECTION 2: RATE CHART */}
        <SectionCard
          title="Rate Chart"
          subtitle={hasProfile ? 'Your content pricing' : 'Complete profile first'}
          icon="💰"
          locked={!hasProfile}
          onClick={() => setModal('rates')}
        >
          {hasProfile && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'reel', label: 'Reel' },
                { key: 'post', label: 'Post' },
                { key: 'story', label: 'Story' },
                { key: 'ugcCollab', label: 'UGC Collab' },
              ].map(({ key, label }) => (
                <div key={key} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                  <div className="text-sm font-bold text-gray-900">
                    {profile.pricing?.[key] > 0
                      ? `₹${profile.pricing[key].toLocaleString('en-IN')}`
                      : <span className="text-gray-300 font-normal">Not set</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* SECTION 3: INSTAGRAM */}
        <SectionCard
          title="Instagram"
          subtitle={
            !hasProfile ? 'Complete profile first' :
            profile.instagram?.isConnected ? `@${profile.instagram.handle}` : 'Not connected'
          }
          icon="📸"
          locked={!hasProfile}
          onClick={undefined}
        >
          {hasProfile && (
            profile.instagram?.isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                    <div className="text-base font-bold text-amber-600">{formatNumber(profile.instagram.followersCount)}</div>
                    <div className="text-xs text-gray-400">Followers</div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                    <div className="text-base font-bold text-red-700">{profile.instagram.engagementRate ? `${profile.instagram.engagementRate}%` : '—'}</div>
                    <div className="text-xs text-gray-400">Engagement</div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                    <div className="text-base font-bold text-blue-700">{formatNumber(profile.instagram.avgViews)}</div>
                    <div className="text-xs text-gray-400">Avg Views</div>
                  </div>
                </div>
                {showDisconnectConfirm ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <div className="text-xs font-semibold text-red-800 mb-1">Disconnect Instagram?</div>
                    <div className="text-xs text-red-600 mb-3">Your verified stats will be removed from your profile.</div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDisconnectConfirm(false)} className="flex-1 py-2 border border-gray-200 bg-white rounded-lg text-xs font-medium text-gray-600">Cancel</button>
                      <button onClick={handleDisconnect} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold">Disconnect</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); handleSync(); }}
                      disabled={syncing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-blue-200 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-50 transition-colors disabled:opacity-60"
                    >
                      <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setShowDisconnectConfirm(true); }}
                      className="px-4 py-2.5 text-gray-400 text-xs hover:text-red-500 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                  Connect your Instagram to show verified followers, engagement rate and avg views to brands.
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleInstagramConnect(); }}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Connect Instagram
                </button>
              </div>
            )
          )}
        </SectionCard>

        {/* SECTION 4: BANK DETAILS */}
        <div className={`transition-all ${!hasProfile ? 'opacity-60 pointer-events-none' : ''}`}>
          {!hasProfile ? (
            <SectionCard title="Bank Details" subtitle="Complete profile first" icon="🏦" locked={true} onClick={undefined}>
              <div />
            </SectionCard>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-xl">🏦</div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Bank Details</div>
                  <div className="text-xs text-gray-400 mt-0.5">For receiving payments from brands</div>
                </div>
              </div>
              <BankDetailsForm />
            </div>
          )}
        </div>

      </div>

      {/* modals */}
      {modal === 'profile' && (
        <ProfileDetailsModal
          profile={profile}
          onClose={() => setModal(null)}
          onSave={fetchProfile}
        />
      )}
      {modal === 'rates' && hasProfile && (
        <RateChartModal
          profile={profile}
          onClose={() => setModal(null)}
          onSave={fetchProfile}
        />
      )}
    </div>
  );
};

export default CreatorProfile;
