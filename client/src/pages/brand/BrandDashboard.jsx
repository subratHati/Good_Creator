import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Users, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import axiosInstance from '../../api/axiosInstance';

const BrandDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/brands/me');
        setProfile(res.data.brand);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
            Welcome{profile?.brandName ? `, ${profile.brandName}` : ''}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Find and connect with the right creators for your brand.
          </p>
        </div>

        {/* profile incomplete banner */}
        {!profile && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <div className="font-semibold text-blue-900">Complete your brand profile</div>
                <div className="text-sm text-blue-700 mt-0.5">
                  Set up your profile so creators know who you are.
                </div>
              </div>
            </div>
            <Link
              to="/brand/profile"
              className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Set up profile <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/brand/browse-creators"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Search size={20} />
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="font-semibold text-gray-900">Browse creators</div>
            <div className="text-sm text-gray-500 mt-0.5">
              Search and filter from thousands of creators
            </div>
          </Link>

          <Link
            to="/brand/openings/create"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                <Plus size={20} />
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="font-semibold text-gray-900">Post an opening</div>
            <div className="text-sm text-gray-500 mt-0.5">
              Let creators apply to work with you
            </div>
          </Link>

          <Link
            to="/brand/openings"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <Users size={20} />
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="font-semibold text-gray-900">Manage openings</div>
            <div className="text-sm text-gray-500 mt-0.5">
              View applications and manage your campaigns
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BrandDashboard;