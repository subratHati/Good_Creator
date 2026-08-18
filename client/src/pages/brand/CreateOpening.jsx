import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../../components/Navbar';
import { createOpening } from '../../api/openings';
import toast from 'react-hot-toast';
import { usePostHog } from '@posthog/react';

const CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'finance', 'entertainment', 'parenting_family', 'vlogging', 'dance', 'religious', 'news_politics', 'video_editing', 'ai_content', 'pets_wildlife', 'other'];

// same display-label logic used across the app's category pickers
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

const DeliverableCounter = ({ label, emoji, value, onChange }) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50">
    <div className="flex items-center gap-2">
      <span className="text-lg">{emoji}</span>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold hover:bg-gray-300 transition-colors cursor-pointer"
      >−</button>
      <span className="w-5 text-center text-sm font-bold text-gray-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
        style={{ backgroundColor: '#155DFC' }}
      >+</button>
    </div>
  </div>
);

const CreateOpening = () => {
  const navigate = useNavigate();
  const posthog = usePostHog();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    deliverables: { reels: 0, posts: 0, stories: 0, ugc: 0 },
    isCollab: false,
    budgetMin: '',
    budgetMax: '',
    isBarter: false,
    barterDetails: '',
    minFollowers: '',
    minEngagement: '',
    categories: [],
    deadline: null, // now a real Date object (or null), not a date-string
    status: 'active',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDeliverable = (key, value) => {
    setForm(prev => ({ ...prev, deliverables: { ...prev.deliverables, [key]: value } }));
  };

  const toggleCategory = (cat) => {
    setForm({
      ...form,
      categories: form.categories.includes(cat)
        ? form.categories.filter(c => c !== cat)
        : [...form.categories, cat],
    });
  };

  // budget: block negative numbers as they're typed, and auto-correct
  // minBudget so it can never exceed maxBudget (and vice versa)
  const handleBudgetChange = (field, rawValue) => {
    // strip a leading minus sign entirely — negative budgets don't make sense
    const value = rawValue.replace(/^-/, '');

    setForm(prev => {
      const updated = { ...prev, [field]: value };
      const min = Number(field === 'budgetMin' ? value : prev.budgetMin);
      const max = Number(field === 'budgetMax' ? value : prev.budgetMax);

      // only enforce the min<=max relationship once BOTH fields have a
      // real value — otherwise a brand typing into an empty max field
      // would get fought with while the other field is still blank
      if (prev.budgetMin !== '' && prev.budgetMax !== '') {
        if (field === 'budgetMin' && min > max) {
          updated.budgetMin = String(max);
        }
        if (field === 'budgetMax' && max < min) {
          updated.budgetMax = String(min);
        }
      }

      return updated;
    });
  };

  const totalDeliverables = Object.values(form.deliverables).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (totalDeliverables === 0) return toast.error('Add at least one deliverable');

    setSaving(true);
    try {
      await createOpening({
        title: form.title,
        description: form.description,
        deliverables: form.deliverables,
        isCollab: form.isCollab,
        budgetMin: Number(form.budgetMin) || 0,
        budgetMax: Number(form.budgetMax) || 0,
        isBarter: form.isBarter,
        barterDetails: form.barterDetails,
        requirements: {
          minFollowers: Number(form.minFollowers) || 0,
          minEngagement: Number(form.minEngagement) || 0,
          categories: form.categories,
        },
        // convert the Date object back to an ISO string for the API —
        // the backend/schema already expects a Date-parseable value,
        // same shape as before, just sourced from the picker now
        deadline: form.deadline ? form.deadline.toISOString() : null,
        status: form.status,
      });
      posthog.capture('campaign_posted', { title: form.title });
      toast.success('Opening created successfully');
      navigate('/brand/openings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create opening');
    } finally {
      setSaving(false);
    }
  };

  // midnight today, in local time — used as the earliest selectable
  // deadline so brands can't pick a date that's already passed
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8 pb-16">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Opening</h1>
          <p className="text-gray-500 mt-1">Post a collab opportunity for creators to apply.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* BASIC DETAILS */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Basic details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input name="title" value={form.title} onChange={handleChange}
                placeholder="e.g. Looking for a food creator for Reels + Stories"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={4} placeholder="Describe what you need, your brand, and what the creator should do..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <div className="relative deadline-picker-wrapper">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                <DatePicker
                  selected={form.deadline}
                  onChange={(date) => setForm({ ...form, deadline: date })}
                  minDate={today}
                  placeholderText="Select a deadline"
                  dateFormat="d MMM yyyy"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
                  wrapperClassName="w-full"
                />
              </div>
              {/* modern minimal calendar popup styling, scoped to this component only */}
              <style>{`
                .deadline-picker-wrapper .react-datepicker {
                  font-family: inherit;
                  border: 1px solid #E5E7EB;
                  border-radius: 16px;
                  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                  overflow: hidden;
                }
                .deadline-picker-wrapper .react-datepicker__header {
                  background-color: white;
                  border-bottom: 1px solid #F3F4F6;
                  padding-top: 14px;
                }
                .deadline-picker-wrapper .react-datepicker__current-month {
                  font-weight: 700;
                  font-size: 13px;
                  color: #101828;
                }
                .deadline-picker-wrapper .react-datepicker__day-name {
                  color: #9CA3AF;
                  font-size: 11px;
                  font-weight: 600;
                }
                .deadline-picker-wrapper .react-datepicker__day {
                  border-radius: 8px;
                  font-size: 13px;
                  color: #374151;
                  cursor: pointer;
                }
                .deadline-picker-wrapper .react-datepicker__day:hover {
                  background-color: #EFF6FF;
                }
                .deadline-picker-wrapper .react-datepicker__day--selected,
                .deadline-picker-wrapper .react-datepicker__day--keyboard-selected {
                  background-color: #155DFC;
                  color: white;
                  font-weight: 700;
                }
                .deadline-picker-wrapper .react-datepicker__day--disabled {
                  color: #D1D5DB;
                  cursor: not-allowed;
                }
                .deadline-picker-wrapper .react-datepicker__day--disabled:hover {
                  background-color: transparent;
                }
                .deadline-picker-wrapper .react-datepicker__navigation-icon::before {
                  border-color: #6B7280;
                }
                .deadline-picker-wrapper .react-datepicker__triangle {
                  display: none;
                }
              `}</style>
            </div>
          </div>

          {/* DELIVERABLES */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Deliverables <span className="text-red-500">*</span></h2>
              <p className="text-xs text-gray-400 mt-0.5">Set how many of each content type you need</p>
            </div>

            <div className="space-y-2">
              <DeliverableCounter label="Reels" emoji="🎬" value={form.deliverables.reels} onChange={v => handleDeliverable('reels', v)} />
              <DeliverableCounter label="Posts" emoji="📷" value={form.deliverables.posts} onChange={v => handleDeliverable('posts', v)} />
              <DeliverableCounter label="Stories" emoji="⏱" value={form.deliverables.stories} onChange={v => handleDeliverable('stories', v)} />
              <DeliverableCounter label="UGC Videos" emoji="🎥" value={form.deliverables.ugc} onChange={v => handleDeliverable('ugc', v)} />
            </div>

            {totalDeliverables > 0 && (
              <div className="rounded-xl p-3 flex flex-wrap gap-2" style={{ backgroundColor: '#F0F5FF' }}>
                <span className="text-xs font-bold text-gray-500">Summary:</span>
                {form.deliverables.reels > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#BFDBFE', color: '#1E3A8A' }}>{form.deliverables.reels} Reel{form.deliverables.reels > 1 ? 's' : ''}</span>}
                {form.deliverables.posts > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#BBF7D0', color: '#064E3B' }}>{form.deliverables.posts} Post{form.deliverables.posts > 1 ? 's' : ''}</span>}
                {form.deliverables.stories > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FDE68A', color: '#78350F' }}>{form.deliverables.stories} Stor{form.deliverables.stories > 1 ? 'ies' : 'y'}</span>}
                {form.deliverables.ugc > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DDD6FE', color: '#4C1D95' }}>{form.deliverables.ugc} UGC</span>}
              </div>
            )}

            {totalDeliverables === 0 && (
              <p className="text-xs text-amber-600">Add at least one deliverable to post this opening</p>
            )}
          </div>

          {/* BUDGET */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Budget</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min budget (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" name="budgetMin" value={form.budgetMin}
                    onChange={e => handleBudgetChange('budgetMin', e.target.value)}
                    placeholder="0" min="0"
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max budget (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" name="budgetMax" value={form.budgetMax}
                    onChange={e => handleBudgetChange('budgetMax', e.target.value)}
                    placeholder="0" min="0"
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Collab tag required</div>
                <div className="text-xs text-gray-500 mt-0.5">Creator must tag your brand in the post</div>
              </div>
              <button type="button" onClick={() => setForm({ ...form, isCollab: !form.isCollab })}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.isCollab ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: form.isCollab ? '22px' : '2px' }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Open to barter</div>
                <div className="text-xs text-gray-500 mt-0.5">Accept product exchange instead of cash</div>
              </div>
              <button type="button" onClick={() => setForm({ ...form, isBarter: !form.isBarter })}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.isBarter ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: form.isBarter ? '22px' : '2px' }}
                />
              </button>
            </div>

            {form.isBarter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barter details</label>
                <input name="barterDetails" value={form.barterDetails} onChange={handleChange}
                  placeholder="e.g. Free product worth ₹2000"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            )}
          </div>

          {/* REQUIREMENTS */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Creator requirements</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min followers</label>
                <input type="number" name="minFollowers" value={form.minFollowers}
                  onChange={e => setForm({ ...form, minFollowers: e.target.value.replace(/^-/, '') })}
                  placeholder="e.g. 5000" min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min engagement (%)</label>
                <input type="number" name="minEngagement" value={form.minEngagement}
                  onChange={e => setForm({ ...form, minEngagement: e.target.value.replace(/^-/, '') })}
                  placeholder="e.g. 3" min="0" max="100"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred creator niches</label>
              <div className="flex flex-wrap gap-2 overflow-y-auto pr-1" style={{ maxHeight: '220px' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${form.categories.includes(cat) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}>{getCategoryLabel(cat)}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-2">
                {['active', 'draft'].map(s => (
                  <button key={s} type="button" onClick={() => setForm({ ...form, status: s })}
                    className={`px-4 py-2 rounded-full text-sm font-medium border capitalize transition-all cursor-pointer ${form.status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            style={{ backgroundColor: '#155DFC' }}>
            <Save size={18} />
            {saving ? 'Creating...' : 'Create opening'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateOpening;
