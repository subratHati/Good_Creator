import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import Navbar from '../../components/Navbar';
import {
  getInstagramAuthUrl,
  syncInstagram,
  disconnectInstagram,
  getMyCreatorProfile,
  createCreatorProfile,
  updateCreatorProfile,
  uploadCreatorPhoto
} from '../../api/creator';
import toast from 'react-hot-toast';

const CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'finance', 'other'];
const LANGUAGES = ['Hindi', 'English', 'Odia', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Punjabi'];

const CreatorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    bio: '',
    city: '',
    state: '',
    categories: [],
    languages: [],
    pricing: {
      reel: '',
      post: '',
      story: '',
      ugcCollab: '',
      ugcNonCollab: '',
    },
    barterEnabled: false,
    isOpenForCollab: true,
    sampleContentLinks: [''],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyCreatorProfile();
        const p = res.data.creator;
        setProfile(p);
        setForm({
          name: p.name || '',
          bio: p.bio || '',
          city: p.location?.city || '',
          state: p.location?.state || '',
          categories: p.categories || [],
          languages: p.languages || [],
          pricing: {
            reel: p.pricing?.reel || '',
            post: p.pricing?.post || '',
            story: p.pricing?.story || '',
            ugcCollab: p.pricing?.ugcCollab || '',
            ugcNonCollab: p.pricing?.ugcNonCollab || '',
          },
          barterEnabled: p.barterEnabled || false,
          isOpenForCollab: p.isOpenForCollab ?? true,
          sampleContentLinks: p.sampleContentLinks?.length
            ? p.sampleContentLinks
            : [''],
        });
      } catch {
        // no profile yet
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInstagramConnect = async () => {
    try {
      const res = await getInstagramAuthUrl();
       console.log('Auth URL:', res.data.url); // add this
      window.location.href = res.data.url;
    } catch {
      toast.error('Failed to get Instagram auth URL');
    }
  };

  const handleInstagramSync = async () => {
    try {
      await syncInstagram();
      toast.success('Instagram synced successfully');
      // refresh profile
      const res = await getMyCreatorProfile();
      setProfile(res.data.creator);
    } catch {
      toast.error('Failed to sync Instagram');
    }
  };

  const handleInstagramDisconnect = async () => {
    try {
      await disconnectInstagram();
      toast.success('Instagram disconnected');
      setShowDisconnectConfirm(false);
      setProfile((prev) => ({
        ...prev,
        instagram: { ...prev.instagram, isConnected: false },
      }));
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePricingChange = (e) => {
    setForm({
      ...form,
      pricing: { ...form.pricing, [e.target.name]: e.target.value },
    });
  };

  const toggleCategory = (cat) => {
    setForm({
      ...form,
      categories: form.categories.includes(cat)
        ? form.categories.filter((c) => c !== cat)
        : [...form.categories, cat],
    });
  };

  const toggleLanguage = (lang) => {
    setForm({
      ...form,
      languages: form.languages.includes(lang)
        ? form.languages.filter((l) => l !== lang)
        : [...form.languages, lang],
    });
  };

  const handleLinkChange = (index, value) => {
    const updated = [...form.sampleContentLinks];
    updated[index] = value;
    setForm({ ...form, sampleContentLinks: updated });
  };

  const addLinkField = () => {
    if (form.sampleContentLinks.length < 5) {
      setForm({
        ...form,
        sampleContentLinks: [...form.sampleContentLinks, ''],
      });
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePhoto', file);

    setPhotoUploading(true);
    try {
      await uploadCreatorPhoto(formData);
      toast.success('Photo uploaded successfully');
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (form.categories.length === 0) {
      toast.error('Select at least one category');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        location: { city: form.city, state: form.state },
        categories: form.categories,
        languages: form.languages,
        pricing: {
          reel: Number(form.pricing.reel) || 0,
          post: Number(form.pricing.post) || 0,
          story: Number(form.pricing.story) || 0,
          ugcCollab: Number(form.pricing.ugcCollab) || 0,
          ugcNonCollab: Number(form.pricing.ugcNonCollab) || 0,
        },
        barterEnabled: form.barterEnabled,
        isOpenForCollab: form.isOpenForCollab,
        sampleContentLinks: form.sampleContentLinks.filter((l) => l.trim()),
      };

      if (profile) {
        await updateCreatorProfile(payload);
      } else {
        await createCreatorProfile(payload);
      }

      toast.success('Profile saved successfully');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

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
      <div className="max-w-3xl mx-auto px-6 py-8 pb-20 md:pb-0">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Creator Profile</h1>
          <p className="text-gray-500 mt-1">
            This is what brands see when they discover you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* profile photo */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Profile photo</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profile?.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload size={16} />
                {photoUploading ? 'Uploading...' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* basic info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Basic info</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio <span className="text-gray-400 font-normal">(max 300 chars)</span>
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                maxLength={300}
                rows={3}
                placeholder="Tell brands about yourself..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {form.bio.length}/300
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Bhubaneswar"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Odisha"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* categories */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">
              Content categories <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize ${form.categories.includes(cat)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* languages */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Languages</h2>
            <p className="text-sm text-gray-500 mb-4">Languages you create content in</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.languages.includes(lang)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Pricing (₹)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Set your rates. Leave blank if you don't offer that content type.
            </p>
            <div className="space-y-3">
              {[
                { key: 'reel', label: 'Reel', desc: 'Short video content' },
                { key: 'post', label: 'Feed post', desc: 'Photo or carousel' },
                { key: 'story', label: 'Story', desc: '24hr story mention' },
                { key: 'ugcCollab', label: 'UGC with collab tag', desc: 'Content with brand collab tag' },
                { key: 'ugcNonCollab', label: 'UGC without collab tag', desc: 'Content without collab tag' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      name={key}
                      value={form.pricing[key]}
                      onChange={handlePricingChange}
                      placeholder="0"
                      min="0"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* toggles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Availability</h2>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Open for collaboration</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Brands can see you're available for collabs
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isOpenForCollab: !form.isOpenForCollab })}
                style={{
                  position: 'relative',
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  backgroundColor: form.isOpenForCollab ? '#2563EB' : '#D1D5DB',
                  transition: 'background-color 0.2s',
                  padding: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: form.isOpenForCollab ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                  display: 'block',
                }} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Open to barter collaborations</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Accept product exchanges instead of cash
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, barterEnabled: !form.barterEnabled })}
                style={{
                  position: 'relative',
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  backgroundColor: form.barterEnabled ? '#2563EB' : '#D1D5DB',
                  transition: 'background-color 0.2s',
                  padding: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: form.barterEnabled ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                  display: 'block',
                }} />
              </button>
            </div>
          </div>

          {/* sample content links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Sample content links</h2>
            <p className="text-sm text-gray-500 mb-4">
              Add links to your best Instagram posts or reels (max 5)
            </p>
            <div className="space-y-3">
              {form.sampleContentLinks.map((link, index) => (
                <input
                  key={index}
                  type="url"
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              ))}
              {form.sampleContentLinks.length < 5 && (
                <button
                  type="button"
                  onClick={addLinkField}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  + Add another link
                </button>
              )}
            </div>
          </div>

          {/* instagram connect section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Instagram account</h2>
            <p className="text-sm text-gray-500 mb-4">
              Connect your Instagram to show verified stats to brands.
            </p>

            {profile?.instagram?.isConnected ? (
              <div className="space-y-4">
                {/* connected state */}
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm">✓</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-green-900">
                      @{profile.instagram.handle}
                    </div>
                    <div className="text-xs text-green-700 mt-0.5">
                      Connected · Last synced:{' '}
                      {profile.instagram.lastSynced
                        ? new Date(profile.instagram.lastSynced).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </div>
                </div>

                {/* live stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Followers
                    </div>
                    <div className="text-xl font-bold text-orange-500">
                      {profile.instagram.followersCount >= 1000
                        ? (profile.instagram.followersCount / 1000).toFixed(1) + 'K'
                        : profile.instagram.followersCount || '0'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Engagement
                    </div>
                    <div className="text-xl font-bold text-orange-500">
                      {profile.instagram.engagementRate
                        ? `${profile.instagram.engagementRate}%`
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* actions */}
                {/* disconnect confirmation state */}
                {showDisconnectConfirm ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="font-semibold text-red-800 text-sm mb-1">
                      Are you sure you want to disconnect?
                    </div>
                    <div className="text-xs text-red-600 mb-3">
                      This will remove your verified Instagram stats from your profile. Brands will no longer see your follower count, engagement rate, and avg views until you reconnect.
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDisconnectConfirm(false)}
                        className="flex-1 py-2 border border-gray-200 bg-white rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleInstagramDisconnect}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                      >
                        Yes, disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleInstagramSync}
                      className="flex-1 py-2.5 border border-blue-200 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
                    >
                      Sync now
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisconnectConfirm(true)}
                      className="px-4 py-2.5 text-gray-400 text-xs hover:text-red-500 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <div className="text-3xl mb-2">📸</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Not connected yet
                  </div>
                  <div className="text-xs text-gray-500">
                    Connect to show verified follower count, engagement rate, and reach to brands.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleInstagramConnect}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Connect Instagram account
                </button>
              </div>
            )}
          </div>

          {/* save button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatorProfile;