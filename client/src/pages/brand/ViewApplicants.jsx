import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getOpeningApplicants, updateApplicationStatus } from '../../api/applications';
import toast from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  viewed: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const ViewApplicants = () => {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getOpeningApplicants(id);
        setApplications(res.data.applications);
        setOpening(res.data.opening);
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleStatusChange = async (applicationId, status) => {
    try {
      await updateApplicationStatus(applicationId, status);
      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status } : app
        )
      );
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
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
      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/brand/openings"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {opening?.title || 'Applicants'}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">👋</div>
            <div className="font-semibold text-gray-900 mb-2">No applications yet</div>
            <div className="text-sm text-gray-500">
              Creators will appear here once they apply to this opening.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                    {app.creatorId?.profilePhoto
                      ? <img src={app.creatorId.profilePhoto} alt="creator" className="w-full h-full object-cover" />
                      : app.creatorId?.name?.[0]?.toUpperCase() || '?'
                    }
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {app.creatorId?.name}
                          {app.creatorId?.isAdminVerified && (
                            <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.creatorId?.instagram?.handle
                            ? `@${app.creatorId.instagram.handle}`
                            : ''}
                          {app.creatorId?.location?.city
                            ? ` · ${app.creatorId.location.city}`
                            : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app._id, e.target.value)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColors[app.status]}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="viewed">Viewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        {app.creatorId?.instagram?.handle && (
                          
                          <a
                            href={"https://instagram.com/" + app.creatorId.instagram.handle}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <ExternalLink size={11} />
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>

                    {/* stats */}
                    <div className="flex gap-3 mt-3 flex-wrap">
                      <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-center">
                        <div className="text-xs text-gray-500">Followers</div>
                        <div className="text-sm font-bold text-orange-500">
                          {formatNumber(app.creatorId?.instagram?.followersCount)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-center">
                        <div className="text-xs text-gray-500">Engagement</div>
                        <div className="text-sm font-bold text-orange-500">
                          {app.creatorId?.instagram?.engagementRate
                            ? `${app.creatorId.instagram.engagementRate}%`
                            : '—'}
                        </div>
                      </div>
                      {app.creatorId?.categories?.slice(0, 2).map((cat) => (
                        <span key={cat} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1.5 rounded-lg capitalize self-center">
                          {cat}
                        </span>
                      ))}
                      {app.creatorId?.barterEnabled && (
                        <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1.5 rounded-lg self-center">
                          Barter ✓
                        </span>
                      )}
                    </div>

                    {/* pricing */}
                    {app.creatorId?.pricing?.reel > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Reel: <span className="font-semibold text-gray-900">
                          ₹{app.creatorId.pricing.reel.toLocaleString('en-IN')}
                        </span>
                        {app.creatorId.pricing.post > 0 && (
                          <span className="ml-3">
                            Post: <span className="font-semibold text-gray-900">
                              ₹{app.creatorId.pricing.post.toLocaleString('en-IN')}
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                    {app.coverNote && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs font-semibold text-gray-500 mb-1">Cover note</div>
                        <p className="text-sm text-gray-700">{app.coverNote}</p>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-400">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewApplicants;