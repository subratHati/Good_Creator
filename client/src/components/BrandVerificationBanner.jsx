import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import useBrandVerification, { refreshBrandVerification } from '../hooks/useBrandVerification';
import { requestBrandVerification } from '../api/brand';
import { VerifiedBadge } from './VerifiedBadge';

// Shows a brand where it stands with admin verification (this is different
// from email verification).
//   pending       - the team is checking the details, within 24 hours
//   verified      - a small green "Verified brand" line
//   not_verified  - the team's note, and a button to ask again after fixing details
// The Home page passes hideWhenVerified: once a brand is verified, the status is
// only shown on its Profile page.
const BrandVerificationBanner = ({ onEditDetails, className = '', hideWhenVerified = false }) => {
  const navigate = useNavigate();
  const { loading, hasProfile, status, note } = useBrandVerification();
  const [asking, setAsking] = useState(false);

  if (loading || !hasProfile || !status) return null;
  if (hideWhenVerified && status === 'verified') return null;

  const askAgain = async () => {
    setAsking(true);
    try {
      const res = await requestBrandVerification();
      toast.success(res.data?.message || 'Sent for verification again');
      refreshBrandVerification();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send for verification');
    } finally {
      setAsking(false);
    }
  };

  if (status === 'verified') {
    return (
      <div className={className} data-testid="verification-verified">
        <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3" style={{ backgroundColor: '#ECFDF3', border: '1.5px solid #ABEFC6' }}>
          <VerifiedBadge size={22} title="Verified brand" />
          <div className="min-w-0">
            <div className="text-sm font-black" style={{ color: '#067647' }}>Verified brand</div>
            <div className="text-xs" style={{ color: '#475467' }}>You can post campaigns and message creators.</div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'not_verified') {
    return (
      <div className={className} data-testid="verification-not-verified">
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#FEF3F2', border: '1.5px solid #FECDCA' }}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: '#FEE4E2' }}>
              <ShieldAlert size={18} color="#D92D20" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black" style={{ color: '#B42318' }}>Not verified yet</div>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#475467' }}>
                We could not verify your brand yet. Please fix the details below and ask us to check again.
              </p>
              {note && (
                <div className="mt-2 rounded-xl px-3 py-2 text-xs leading-relaxed" style={{ backgroundColor: 'white', border: '1px solid #FECDCA', color: '#101828', overflowWrap: 'anywhere' }}>
                  <span className="font-black">Note from our team: </span>{note}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => (onEditDetails ? onEditDetails() : navigate('/brand/profile'))}
                  className="px-4 py-2 rounded-xl text-xs font-black"
                  style={{ backgroundColor: 'white', color: '#101828', border: '1.5px solid #D0D5DD' }}
                >
                  Edit my details
                </button>
                <button
                  onClick={askAgain}
                  disabled={asking}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-60"
                  style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
                >
                  {asking ? 'Sending...' : 'Request verification again'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // pending
  return (
    <div className={className} data-testid="verification-pending">
      <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFAEB', border: '1.5px solid #FEDF89' }}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: '#FEF0C7' }}>
            <Clock size={18} color="#B54708" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black" style={{ color: '#93370D' }}>Verification in progress</div>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#475467' }}>
              We are checking your brand details. This is done within 24 hours.
            </p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#475467' }}>
              Meanwhile you can browse creators, check their Instagram stats and save creators.
              Posting campaigns and messaging creators unlock once you are verified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandVerificationBanner;
