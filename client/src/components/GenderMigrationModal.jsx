import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { updateCreatorProfile } from '../api/creator';
import toast from 'react-hot-toast';

// Shown once to existing creators who registered before the gender field
// existed. Blocks (no close/dismiss button) until they select and submit —
// same reasoning as CategoryPolicyDialog's mode="existing": a required
// field that predates their account needs an explicit, unskippable prompt
// rather than being silently left blank forever.
const GenderMigrationModal = ({ onSaved }) => {
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!gender) return toast.error('Please select your gender');
    setSaving(true);
    try {
      await updateCreatorProfile({ gender });
      toast.success('Thanks! Your profile is now complete.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save, please try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <div className="px-6 pt-6 pb-4 flex items-start gap-3" style={{ backgroundColor: '#EFF6FF' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#DBEAFE' }}
          >
            <UserRound size={20} color="#1D4ED8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#1D4ED8' }}>
              GoodCreator · Quick Update
            </div>
            <h3 className="font-black text-lg" style={{ color: '#101828' }}>
              One quick thing before you continue
            </h3>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            We've added gender as a required field on GoodCreator profiles. Please select yours to continue using your account.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(opt.value)}
                className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                  gender === opt.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
            style={{ backgroundColor: '#155DFC', boxShadow: saving ? 'none' : '0 3px 0 0 #0c3eb5' }}
          >
            {saving ? 'Saving...' : 'Save and continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenderMigrationModal;
