import { useState, useRef, useEffect } from 'react';
import { createCreatorProfile } from '../api/creator';
import { createBrandProfile } from '../api/brand';
import CategoryPolicyDialog from './CategoryPolicyDialog';
import toast from 'react-hot-toast';

const CREATOR_CATEGORIES = [
  'lifestyle', 'food', 'travel', 'fashion', 'beauty',
  'tech', 'fitness', 'gaming', 'education', 'finance',
  'entertainment', 'parenting_family', 'vlogging', 'dance',
  'religious', 'news_politics', 'video_editing', 'ai_content',
  'pets_wildlife', 'other'
];
const BRAND_CATEGORIES = [
  'fashion', 'beauty', 'food', 'tech', 'fitness',
  'lifestyle', 'travel', 'education', 'finance',
  'entertainment', 'parenting_family', 'vlogging', 'dance',
  'religious', 'news_politics', 'video_editing', 'ai_content',
  'pets_wildlife', 'other'
];
const MAX_CREATOR_CATEGORIES = 3;
const MIN_CREATOR_CATEGORIES = 1;

// same display-label logic as CreatorProfile.jsx, kept in sync — these
// two files each maintain their own copy since categories aren't
// currently centralized into one shared constants file
const categoryLabels = {
  parenting_family: 'Parenting/Family',
  news_politics: 'News/Politics',
  pets_wildlife: 'Pets/Wildlife',
  ai_content: 'AI Content',
};
const getCategoryLabel = (cat) => {
  if (categoryLabels[cat]) return categoryLabels[cat];
  const spaced = cat.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

// Custom dropdown, not a native <select> — native selects render as an
// OS-level overlay that escapes the modal's own DOM/z-index entirely,
// covering the whole screen instead of staying contained. This renders
// its own list inside our normal DOM, so it stays properly scoped to
// the modal and respects our styling.
const CategoryDropdown = ({ options, onSelect, disabled, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-left flex items-center justify-between disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        <span className={disabled ? '' : 'text-gray-500'}>{placeholder}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && !disabled && (
        <div className="absolute left-0 right-0 mb-1.5 bottom-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto z-50" style={{ maxHeight: '220px' }}>
          {options.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => { onSelect(cat); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const CreatorSetupModal = ({ onComplete }) => {
  const [form, setForm] = useState({ name: '', city: '', state: '', gender: '', categories: [] });
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
    if (!form.gender) return toast.error('Please select your gender');
    if (form.categories.length < MIN_CREATOR_CATEGORIES) return toast.error('Please select at least 1 category');
    if (form.categories.length > MAX_CREATOR_CATEGORIES) return setShowPolicyDialog(true);
    setSaving(true);
    try {
      await createCreatorProfile({
        name: form.name.trim(),
        location: { city: form.city.trim(), state: form.state.trim() },
        gender: form.gender,
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

<div className="mb-4">
  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
  <div className="grid grid-cols-3 gap-2">
    {[
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
    ].map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => setForm({ ...form, gender: opt.value })}
        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
          form.gender === opt.value
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
</div>

              {/* selected categories shown as removable chips, above the dropdown */}
              {form.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {form.categories.map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold bg-blue-600 text-white"
                    >
                      {getCategoryLabel(cat)}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20"
                        aria-label={`Remove ${getCategoryLabel(cat)}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <CategoryDropdown
                options={CREATOR_CATEGORIES.filter(cat => !form.categories.includes(cat))}
                onSelect={toggleCategory}
                disabled={form.categories.length >= MAX_CREATOR_CATEGORIES}
                placeholder={form.categories.length >= MAX_CREATOR_CATEGORIES ? 'Maximum 3 selected' : 'Select a category to add...'}
              />

              {form.categories.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">Select at least 1 category</p>
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
              <CategoryDropdown
                options={BRAND_CATEGORIES}
                onSelect={(cat) => setForm({ ...form, category: cat })}
                placeholder={form.category ? getCategoryLabel(form.category) : 'Select category'}
              />
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
