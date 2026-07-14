import { useState } from 'react';
import { createCreatorProfile } from '../api/creator';
import { createBrandProfile } from '../api/brand';
import CategoryPolicyDialog from './CategoryPolicyDialog';
import toast from 'react-hot-toast';

const CREATOR_CATEGORIES = [
  'lifestyle', 'food', 'travel', 'fashion', 'beauty',
  'tech', 'fitness', 'gaming', 'education', 'finance', 'other'
];

const BRAND_CATEGORIES = [
  'fashion', 'beauty', 'food', 'tech', 'fitness',
  'lifestyle', 'travel', 'education', 'finance', 'other'
];

const MAX_CREATOR_CATEGORIES = 3;
const MIN_CREATOR_CATEGORIES = 1;

export const CreatorSetupModal = ({ onComplete }) => {
  const [form, setForm] = useState({ name: '', city: '', state: '', categories: [] });
  const [saving, setSaving] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);

  const toggleCategory = (cat) => {
    setForm(prev => {
      const alreadySelected = prev.categories.includes(cat);

      if (!alreadySelected && prev.categories.length >= MAX_CREATOR_CATEGORIES) {
        setShowPolicyDialog(true);
        return prev;
      }

      return {
        ...prev,
        categories: alreadySelected
          ? prev.categories.filter(c => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Please enter your name');
    if (!form.city.trim()) return toast.error('Please enter your city');
    if (!form.state.trim()) return toast.error('Please enter your state');
    if (form.categories.length < MIN_CREATOR_CATEGORIES) return toast.error('Please select at least 1 category');
    if (form.categories.length > MAX_CREATOR_CATEGORIES) return setShowPolicyDialog(true);
    setSaving(true);
    try {
      await createCreatorProfile({
        name: form.name.trim(),
        location: { city: form.city.trim(), state: form.state.trim() },
        categories: form.categories,
      });
      toast.success('Profile created! Welcome to GoodCreator 🎉');
      window.dispatchEvent(new Event('profileCreated'));
      onComplete();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl overflow-y-auto" style={{ maxHeight: '95vh' }}>
        <div className="p-6 md:p-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6 md:hidden" />
          <div className="mb-6">
            <div className="text-2xl mb-2">👋</div>
            <h2 className="text-xl font-bold text-gray-900">Let's set up your profile</h2>
            <p className="text-sm text-gray-500 mt-1">Just a few details so brands can discover you. Takes 30 seconds.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Sharma" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">State <span className="text-red-500">*</span></label>
                <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Maharashtra" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Content categories <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(select 1-3 · {form.categories.length} selected)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CREATOR_CATEGORIES.map(cat => {
                  const isSelected = form.categories.includes(cat);
                  const isDisabled = !isSelected && form.categories.length >= MAX_CREATOR_CATEGORIES;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      disabled={isDisabled}
                      className={`px-3 py-2 rounded-full text-xs font-semibold border capitalize transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : isDisabled
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              {form.categories.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">Select at least 1 category</p>
              )}
              {form.categories.length >= MAX_CREATOR_CATEGORIES && (
                <p className="text-xs text-gray-400 mt-2">Maximum {MAX_CREATOR_CATEGORIES} categories selected</p>
              )}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving} className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-60">
            {saving ? 'Setting up...' : 'Get started →'}
          </button>
          <p className="text-xs text-center text-gray-400 mt-3">You can add more details (pricing, Instagram, bio) from your profile anytime.</p>
        </div>
      </div>

      {showPolicyDialog && (
        <CategoryPolicyDialog mode="blocked" onClose={() => setShowPolicyDialog(false)} />
      )}
    </div>
  );
};

export const BrandSetupModal = ({ onComplete }) => {
  const [form, setForm] = useState({ brandName: '', city: '', state: '', category: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.brandName.trim()) return toast.error('Please enter your brand name');
    if (!form.city.trim()) return toast.error('Please enter your city');
    if (!form.state.trim()) return toast.error('Please enter your state');
    if (!form.category) return toast.error('Please select a category');
    setSaving(true);
    try {
      await createBrandProfile({
        brandName: form.brandName.trim(),
        location: { city: form.city.trim(), state: form.state.trim() },
        category: form.category,
      });
      toast.success('Brand profile created! Welcome to GoodCreator 🎉');
      window.dispatchEvent(new Event('profileCreated'));
      onComplete();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl overflow-y-auto" style={{ maxHeight: '95vh' }}>
        <div className="p-6 md:p-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6 md:hidden" />
          <div className="mb-6">
            <div className="text-2xl mb-2">🏷️</div>
            <h2 className="text-xl font-bold text-gray-900">Set up your brand</h2>
            <p className="text-sm text-gray-500 mt-1">Tell creators who you are. Takes 30 seconds.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand name <span className="text-red-500">*</span></label>
              <input type="text" value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} placeholder="e.g. Nykaa, Mamaearth" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">State <span className="text-red-500">*</span></label>
                <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Maharashtra" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand category <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white capitalize">
                <option value="">Select category</option>
                {BRAND_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving} className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-60">
            {saving ? 'Setting up...' : 'Get started →'}
          </button>
          <p className="text-xs text-center text-gray-400 mt-3">You can add logo, description, and more from your profile anytime.</p>
        </div>
      </div>
    </div>
  );
};
