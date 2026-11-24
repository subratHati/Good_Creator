import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useBrandVerification from '../hooks/useBrandVerification';
import Navbar from './Navbar';
import BrandVerificationBanner from './BrandVerificationBanner';

// Wrap a page that only a verified brand may use (messages, campaigns).
// Creators and admins pass straight through. An unverified brand sees an
// explanation instead of the page.
//
// This is only the friendly screen. The real lock is on the server: every one
// of these actions is refused there for an unverified brand, whatever the
// browser shows.
const RequireVerifiedBrand = ({ children, feature = 'These pages' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isBrand, loading, hasProfile, isVerified } = useBrandVerification();

  if (!user || user.role !== 'brand') return children;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // no brand profile yet: the pages themselves already ask the brand to create it
  if (!isBrand || !hasProfile || isVerified) return children;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8FAFC' }}>
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: '#EFF6FF' }}>
              <Lock size={24} color="#155DFC" />
            </div>
            <h1 className="text-xl font-black" style={{ color: '#101828' }}>{feature} are locked until your brand is verified</h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#667085' }}>
              We check every brand by hand so that creators can trust who they work with.
              Once your brand is verified you can post campaigns and message creators.
            </p>
          </div>

          <BrandVerificationBanner className="mb-5" />

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/brand/browse-creators')}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-white"
              style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
            >
              Browse creators
            </button>
            <button
              onClick={() => navigate('/brand/profile')}
              className="w-full py-3.5 rounded-2xl text-sm font-black"
              style={{ backgroundColor: 'white', color: '#101828', border: '1.5px solid #D0D5DD' }}
            >
              See my verification details
            </button>
            <button
              onClick={() => navigate('/contact-help')}
              className="w-full py-3 text-sm font-bold"
              style={{ color: '#155DFC' }}
            >
              Contact &amp; Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequireVerifiedBrand;
