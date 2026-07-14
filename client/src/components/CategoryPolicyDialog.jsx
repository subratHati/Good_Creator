import { AlertTriangle, X } from 'lucide-react';

// Shared dialog for the "max 3 categories" policy.
// mode="blocked"  — shown when a creator tries to select/save a 4th category
// mode="existing" — shown on login to creators who already have 4+ categories saved
//                   from before this policy existed. This is a TEMPORARY dialog —
//                   remove once existing over-limit accounts have been migrated/fixed.
const CategoryPolicyDialog = ({ mode = 'blocked', currentCount, onClose, onFixNow }) => {
  const isExisting = mode === 'existing';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={isExisting ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-3" style={{ backgroundColor: '#FEF9C3' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#FDE047' }}
          >
            <AlertTriangle size={20} color="#78350F" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#92400E' }}>
              GoodCreator · New Policy
            </div>
            <h3 className="font-black text-lg" style={{ color: '#78350F' }}>
              {isExisting ? 'Your account needs an update' : 'Category limit reached'}
            </h3>
          </div>
          {!isExisting && (
            <button onClick={onClose} className="flex-shrink-0 text-amber-700 hover:text-amber-900">
              <X size={18} />
            </button>
          )}
        </div>

        {/* body */}
        <div className="px-6 py-5">
          {isExisting ? (
            <>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                As part of GoodCreator's new creator quality policy, every creator profile is limited to a
                maximum of <strong>3 content categories</strong>. This helps brands find creators who
                specialize in the niches they're actually looking for, instead of creators spread too thin
                across many unrelated categories.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Your profile currently has <strong>{currentCount} categories</strong> selected — more than
                the new limit allows.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Please update your profile and select your <strong>top 1 to 3 categories</strong> to
                continue enjoying full visibility to brands on GoodCreator.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                As part of GoodCreator's creator quality policy, every creator profile can select a
                minimum of <strong>1</strong> and a maximum of <strong>3 content categories</strong> — no more.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                This helps brands find creators who specialize in the niches they're actually looking for.
                Please remove a category before adding another.
              </p>
            </>
          )}
        </div>

        {/* footer */}
        <div className="px-6 pb-6 flex gap-3">
          {isExisting ? (
            <button
              onClick={onFixNow}
              className="w-full py-3 rounded-xl text-sm font-black text-white"
              style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
            >
              Update my categories now
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-black text-white"
              style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPolicyDialog;
