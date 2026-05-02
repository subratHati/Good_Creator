import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import Navbar from '../../components/Navbar';
import {
  getMyBrandProfile,
  createBrandProfile,
  updateBrandProfile,
  uploadBrandLogo,
} from '../../api/brand';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'fashion', 'food', 'beauty', 'tech', 'fitness',
  'travel', 'education', 'finance', 'lifestyle', 'other'
];

const BrandProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [form, setForm] = useState({
    brandName: '',
    description: '',
    website: '',
    category: '',
    city: '',
    state: '',
    instagramHandle: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyBrandProfile();
        const p = res.data.brand;
        setProfile(p);
        setForm({
          brandName: p.brandName || '',
          description: p.description || '',
          website: p.website || '',
          category: p.category || '',
          city: p.location?.city || '',
          state: p.location?.state || '',
          instagramHandle: p.instagram?.handle || '',
        });
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    setLogoUploading(true);
    try {
      await uploadBrandLogo(formData);
      toast.success('Logo uploaded');
    } catch {
      toast.error('Logo upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brandName.trim()) {
      toast.error('Brand name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        brandName: form.brandName,
        description: form.description,
        website: form.website,
        category: form.category,
        location: { city: form.city, state: form.state },
        'instagram.handle': form.instagramHandle,
      };
      if (profile) {
        await updateBrandProfile(payload);
      } else {
        await createBrandProfile(payload);
      }
      toast.success('Profile saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
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
          <h1 className="text-2xl font-bold text-gray-900">Brand Profile</h1>
          <p className="text-gray-500 mt-1">This is what creators see about your brand.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* logo */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Brand logo</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                {profile?.logo ? (
                  <img src={profile.logo} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🏷️</span>
                )}
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload size={16} />
                {logoUploading ? 'Uploading...' : 'Upload logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
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
                Brand name <span className="text-red-500">*</span>
              </label>
              <input
                name="brandName"
                value={form.brandName}
                onChange={handleChange}
                placeholder="Your brand name"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Tell creators about your brand..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://yourbrand.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
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

          {/* category */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Brand category</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize ${
                    form.category === cat
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* instagram handle */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Instagram handle</h2>
            <p className="text-sm text-gray-500 mb-4">
              Enter your brand's Instagram handle for verification.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input
                name="instagramHandle"
                value={form.instagramHandle}
                onChange={handleChange}
                placeholder="yourbrand"
                className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BrandProfile;