import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { createOpening } from '../../api/openings';
import toast from 'react-hot-toast';

const CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'other'];

const CreateOpening = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    contentType: '',
    isCollab: true,
    quantity: 1,
    budgetMin: '',
    budgetMax: '',
    isBarter: false,
    barterDetails: '',
    minFollowers: '',
    minEngagement: '',
    categories: [],
    deadline: '',
    status: 'active',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleCategory = (cat) => {
    setForm({
      ...form,
      categories: form.categories.includes(cat)
        ? form.categories.filter((c) => c !== cat)
        : [...form.categories, cat],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.contentType) {
      toast.error('Select a content type');
      return;
    }

    setSaving(true);
    try {
      await createOpening({
        title: form.title,
        description: form.description,
        contentType: form.contentType,
        isCollab: form.isCollab,
        quantity: Number(form.quantity),
        budgetMin: Number(form.budgetMin) || 0,
        budgetMax: Number(form.budgetMax) || 0,
        isBarter: form.isBarter,
        barterDetails: form.barterDetails,
        requirements: {
          minFollowers: Number(form.minFollowers) || 0,
          minEngagement: Number(form.minEngagement) || 0,
          categories: form.categories,
        },
        deadline: form.deadline || null,
        status: form.status,
      });

      toast.success('Opening created successfully');
      navigate('/brand/openings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create opening');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Opening</h1>
          <p className="text-gray-500 mt-1">Post a collab opportunity for creators to apply.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* basic details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Basic details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Looking for a food creator for Reel"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe what you need, your brand, and what the creator should do..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {['reel', 'post', 'story', 'ugc'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, contentType: type })}
                    className={`px-4 py-2 rounded-full text-sm font-medium border capitalize transition-all ${
                      form.contentType === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* budget */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Budget</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min budget (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="budgetMin"
                    value={form.budgetMin}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max budget (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="budgetMax"
                    value={form.budgetMax}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Collab tag required</div>
                <div className="text-xs text-gray-500 mt-0.5">Creator must tag your brand in the post</div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isCollab: !form.isCollab })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.isCollab ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.isCollab ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Open to barter</div>
                <div className="text-xs text-gray-500 mt-0.5">Accept product exchange instead of cash</div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isBarter: !form.isBarter })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.isBarter ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.isBarter ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {form.isBarter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barter details</label>
                <input
                  name="barterDetails"
                  value={form.barterDetails}
                  onChange={handleChange}
                  placeholder="e.g. Free product worth ₹2000"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            )}
          </div>

          {/* requirements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Creator requirements</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min followers</label>
                <input
                  type="number"
                  name="minFollowers"
                  value={form.minFollowers}
                  onChange={handleChange}
                  placeholder="e.g. 5000"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min engagement (%)</label>
                <input
                  type="number"
                  name="minEngagement"
                  value={form.minEngagement}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred creator niches
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border capitalize transition-all ${
                      form.categories.includes(cat)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-2">
                {['active', 'draft'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className={`px-4 py-2 rounded-full text-sm font-medium border capitalize transition-all ${
                      form.status === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? 'Creating...' : 'Create opening'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOpening;