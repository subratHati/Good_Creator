import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyApplications } from '../../api/applications';
import useCreatorProfileGuard from '../../hooks/useCreatorProfileGuard';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  viewed: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const contentTypeColors = {
  reel: 'bg-blue-100 text-blue-700',
  post: 'bg-purple-100 text-purple-700',
  story: 'bg-orange-100 text-orange-700',
  ugc: 'bg-teal-100 text-teal-700',
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { checking } = useCreatorProfileGuard();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyApplications();
        setApplications(res.data.applications);
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (checking) return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

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
      <div className="max-w-4xl mx-auto px-6 py-8 pb-20 md:pb-0">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 mt-1">Track all your collab applications</p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <div className="font-semibold text-gray-900 mb-2">No applications yet</div>
            <div className="text-sm text-gray-500">
              Browse brand openings and apply to collabs that interest you.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {app.brandId?.logo
                        ? <img src={app.brandId.logo} alt="brand" className="w-full h-full object-cover" />
                        : <span className="text-lg">🏷️</span>
                      }
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {app.openingId?.title || 'Opening'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {app.brandId?.brandName || 'Brand'}
                        {app.brandId?.location?.city
                          ? ` · ${app.brandId.location.city}`
                          : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {app.openingId?.contentType && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${contentTypeColors[app.openingId.contentType]}`}>
                        {app.openingId.contentType}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                {app.coverNote && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-semibold text-gray-500 mb-1">Your cover note</div>
                    <p className="text-sm text-gray-700">{app.coverNote}</p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                  {app.openingId?.budgetMax > 0 && (
                    <span className="font-medium text-gray-600">
                      Budget: ₹{app.openingId.budgetMin?.toLocaleString('en-IN')} – ₹{app.openingId.budgetMax?.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;