import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, User, TrendingUp, Eye, Star, ArrowRight, CheckCircle, AlertCircle, Link2, MessageSquare } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getMyCreatorProfile } from '../../api/creator';
import useAuth from '../../hooks/useAuth';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
      <Icon size={20} />
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-500 mt-0.5">{label}</div>
  </div>
);

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyCreatorProfile();
        setProfile(res.data.creator);
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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

      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your creator profile.
          </p>
        </div>

        {/* profile incomplete banner */}
        {!profile && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <div className="font-semibold text-blue-900">Complete your profile</div>
                <div className="text-sm text-blue-700 mt-0.5">
                  Set up your creator profile so brands can discover you.
                </div>
              </div>
            </div>
            <Link
              to="/creator/profile"
              className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Set up profile <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* instagram not connected banner */}
        {profile && !profile.instagram?.isConnected && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-8 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Link2 className="text-orange-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <div className="font-semibold text-orange-900">Connect your Instagram</div>
                <div className="text-sm text-orange-700 mt-0.5">
                  Connect Instagram to show verified stats to brands.
                </div>
              </div>
            </div>
            <Link
              to="/creator/profile"
              className="flex-shrink-0 flex items-center gap-1.5 bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Connect <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* stats grid */}
        {profile && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Followers"
              value={formatNumber(profile.instagram?.followersCount)}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Engagement rate"
              value={profile.instagram?.engagementRate
                ? `${profile.instagram.engagementRate}%`
                : '—'}
              color="bg-orange-50 text-orange-500"
            />
            <StatCard
              icon={Eye}
              label="Avg reach"
              value={formatNumber(profile.instagram?.avgReach)}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              icon={Star}
              label="Avg likes"
              value={formatNumber(profile.instagram?.avgLikes)}
              color="bg-purple-50 text-purple-600"
            />
          </div>
        )}

        {/* quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/creator/profile"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <User size={20} />
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="font-semibold text-gray-900">Edit profile</div>
            <div className="text-sm text-gray-500 mt-0.5">
              Update your info, pricing and availability
            </div>
          </Link>

          <Link
            to="/creator/browse-brands"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="font-semibold text-gray-900">Browse openings</div>
            <div className="text-sm text-gray-500 mt-0.5">
              Find brands looking for creators like you
            </div>
          </Link>

          <Link
            to="/creator/applications"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="font-semibold text-gray-900">My applications</div>
            <div className="text-sm text-gray-500 mt-0.5">
              Track your collab applications
            </div>
          </Link>

          <Link
            to="/creator/enquiries"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="font-semibold text-gray-900">Enquiries</div>
            <div className="text-sm text-gray-500 mt-0.5">
              Messages from brands
            </div>
          </Link>
        </div>

        {/* profile status */}
        {profile && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-semibold text-gray-900">Profile status</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Last synced:{' '}
                  {profile.instagram?.lastSynced
                    ? new Date(profile.instagram.lastSynced).toLocaleDateString()
                    : 'Never'}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${profile.isOpenForCollab
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${profile.isOpenForCollab ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  {profile.isOpenForCollab ? 'Open for collab' : 'Closed for collab'}
                </span>
                {profile.barterEnabled && (
                  <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                    Barter available
                  </span>
                )}
                {profile.isAdminVerified && (
                  <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
                    <CheckCircle size={12} />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard;