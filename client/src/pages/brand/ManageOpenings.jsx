import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, X, Users } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getMyOpenings, deleteOpening } from '../../api/openings';
import toast from 'react-hot-toast';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  draft: 'bg-yellow-100 text-yellow-700',
};

const contentTypeColors = {
  reel: 'bg-blue-100 text-blue-700',
  post: 'bg-purple-100 text-purple-700',
  story: 'bg-orange-100 text-orange-700',
  ugc: 'bg-teal-100 text-teal-700',
};

const ManageOpenings = () => {
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyOpenings();
        setOpenings(res.data.openings);
      } catch {
        setOpenings([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleClose = async (id) => {
    try {
      await deleteOpening(id);
      setOpenings(openings.map((o) =>
        o._id === id ? { ...o, status: 'closed' } : o
      ));
      toast.success('Opening closed');
    } catch {
      toast.error('Failed to close opening');
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

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Openings</h1>
            <p className="text-gray-500 mt-1">Manage your collab opportunities</p>
          </div>
          <Link
            to="/brand/openings/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New opening
          </Link>
        </div>

        {openings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <div className="font-semibold text-gray-900 mb-2">No openings yet</div>
            <div className="text-sm text-gray-500 mb-6">
              Create your first opening to start receiving applications from creators.
            </div>
            <Link
              to="/brand/openings/create"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Create opening
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {openings.map((opening) => (
              <div
                key={opening._id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-900">{opening.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${contentTypeColors[opening.contentType]}`}>
                        {opening.contentType}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[opening.status]}`}>
                        {opening.status}
                      </span>
                      {opening.isBarter && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                          Barter
                        </span>
                      )}
                    </div>

                    {opening.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {opening.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span>
                        Budget: <span className="font-medium text-gray-900">
                          {opening.budgetMin || opening.budgetMax
                            ? `₹${opening.budgetMin.toLocaleString('en-IN')} – ₹${opening.budgetMax.toLocaleString('en-IN')}`
                            : 'Not specified'}
                        </span>
                      </span>
                      <span>
                        Quantity: <span className="font-medium text-gray-900">{opening.quantity}</span>
                      </span>
                      {opening.deadline && (
                        <span>
                          Deadline: <span className="font-medium text-gray-900">
                            {new Date(opening.deadline).toLocaleDateString()}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/brand/openings/${opening._id}/applicants`}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Users size={14} />
                      Applicants
                    </Link>
                    {opening.status !== 'closed' && (
                      <button
                        onClick={() => handleClose(opening._id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <X size={14} />
                        Close
                      </button>
                    )}
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

export default ManageOpenings;