import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getMyOpenings, deleteOpening } from '../../api/openings';
import toast from 'react-hot-toast';

const statusStyles = {
  active: { bg: '#DCFCE7', color: '#166534', shadow: '0 2px 0 0 #86EFAC' },
  closed: { bg: '#F3F4F6', color: '#6B7280', shadow: '0 2px 0 0 #D1D5DB' },
  draft: { bg: '#FEF9C3', color: '#854D0E', shadow: '0 2px 0 0 #FDE047' },
};

const ManageOpenings = () => {
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmCloseId, setConfirmCloseId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyOpenings();
        setOpenings(res.data.openings);
      } catch { setOpenings([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleClose = async (id) => {
    try {
      await deleteOpening(id);
      setOpenings(openings.map(o => o._id === id ? { ...o, status: 'closed' } : o));
      toast.success('Campaign closed');
    } catch { toast.error('Failed to close campaign'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      </div>
    );
  }

  const active = openings.filter(o => o.status === 'active').length;
  const draft = openings.filter(o => o.status === 'draft').length;
  const closed = openings.filter(o => o.status === 'closed').length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F7', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-10">

          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black" style={{ color: '#101828' }}>My Campaigns</h1>
              <p className="text-sm text-gray-400 mt-0.5">Manage your collab opportunities</p>
            </div>
            <Link to="/brand/openings/create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-white text-sm transition-transform hover:scale-95"
              style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}>
              <Plus size={15} /> New Campaign
            </Link>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Active', count: active, bg: '#DCFCE7', color: '#166534', shadow: '0 3px 0 0 #86EFAC' },
              { label: 'Draft', count: draft, bg: '#FEF9C3', color: '#854D0E', shadow: '0 3px 0 0 #FDE047' },
              { label: 'Closed', count: closed, bg: '#F3F4F6', color: '#6B7280', shadow: '0 3px 0 0 #D1D5DB' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: s.bg, boxShadow: s.shadow }}>
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
                <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* empty state */}
          {openings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center" style={{ boxShadow: '0 4px 0 0 #E5E5E5' }}>
              <div className="text-5xl mb-4">📋</div>
              <div className="font-black text-gray-900 mb-2 text-lg">No campaigns yet</div>
              <div className="text-sm text-gray-400 mb-6">Create your first campaign to start receiving applications from creators.</div>
              <Link to="/brand/openings/create"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-white text-sm"
                style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}>
                <Plus size={15} /> Create Campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {openings.map(opening => {
                const st = statusStyles[opening.status] || statusStyles.closed;

                // build deliverables
                const d = opening.deliverables || {};
                const delBoxes = [
                  { type: 'Reel', qty: d.reels || 0 },
                  { type: 'Post', qty: d.posts || 0 },
                  { type: 'Story', qty: d.stories || 0 },
                  { type: 'UGC', qty: d.ugc || 0 },
                ].filter(b => b.qty > 0);
                if (delBoxes.length === 0 && opening.contentType) {
                  delBoxes.push({ type: opening.contentType.charAt(0).toUpperCase() + opening.contentType.slice(1), qty: opening.quantity || 1 });
                }

                return (
                  <div key={opening._id} className="bg-white rounded-3xl overflow-hidden"
                    style={{ border: '1.5px solid #F0F0F0', boxShadow: '0 3px 0 0 #E5E5E5' }}>

                    {/* colored top strip based on status */}
                    <div style={{ height: '4px', backgroundColor: opening.status === 'active' ? '#22C55E' : opening.status === 'draft' ? '#FACC15' : '#D1D5DB' }} />

                    <div className="p-4 md:p-5">
                      {/* top row — title + status + actions */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-black text-base truncate" style={{ color: '#101828' }}>{opening.title}</h3>
                            <span className="text-xs font-black px-2.5 py-1 rounded-full capitalize flex-shrink-0"
                              style={{ backgroundColor: st.bg, color: st.color, boxShadow: st.shadow }}>
                              {opening.status}
                            </span>
                            {opening.isBarter && (
                              <span className="text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#FEF3C7', color: '#92400E', boxShadow: '0 2px 0 0 #FDE68A' }}>
                                Barter
                              </span>
                            )}
                          </div>
                          {opening.description && (
                            <p className="text-xs text-gray-400 line-clamp-1">{opening.description}</p>
                          )}
                        </div>

                        {/* action buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link to={`/brand/openings/${opening._id}/applicants`}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-transform hover:scale-95"
                            style={{ backgroundColor: '#EFF6FF', color: '#155DFC' }}>
                            <Users size={12} /> Applicants
                          </Link>
                          {opening.status !== 'closed' && (
                            <button onClick={() => setConfirmCloseId(opening._id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-transform hover:scale-95"
                              style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                              <X size={12} /> Close
                            </button>
                          )}
                        </div>
                      </div>

                      {/* deliverable boxes */}
                      {delBoxes.length > 0 && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {delBoxes.map((b, i) => (
                            <div key={i} className="text-center rounded-xl px-3 py-1.5"
                              style={{ backgroundColor: '#F8FAFF', border: '1.5px solid #DBEAFE' }}>
                              <div className="text-xs font-black" style={{ color: '#1E3A8A' }}>{b.qty} {b.type}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* bottom info row */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* budget */}
                        <div className="rounded-xl px-3 py-1.5 flex items-center gap-1.5"
                          style={{ backgroundColor: '#FACC15', boxShadow: '0 2px 0 0 #B45309' }}>
                          <span className="text-xs font-black" style={{ color: '#0F172A' }}>
                            {opening.budgetMin > 0 && opening.budgetMax > 0
                              ? `₹${opening.budgetMin.toLocaleString('en-IN')} – ₹${opening.budgetMax.toLocaleString('en-IN')}`
                              : opening.budgetMax > 0
                                ? `Up to ₹${opening.budgetMax.toLocaleString('en-IN')}`
                                : opening.isBarter ? 'Barter only' : 'Budget TBD'
                            }
                          </span>
                        </div>

                        {/* deadline */}
                        {opening.deadline && (
                          <div className="rounded-xl px-3 py-1.5"
                            style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                            <span className="text-xs font-bold" style={{ color: '#6B7280' }}>
                              Due {new Date(opening.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        )}

                        {/* requirements */}
                        {opening.requirements?.minFollowers > 0 && (
                          <div className="rounded-xl px-3 py-1.5"
                            style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0' }}>
                            <span className="text-xs font-bold" style={{ color: '#166534' }}>
                              Min {(opening.requirements.minFollowers / 1000).toFixed(0)}K followers
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
      {confirmCloseId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setConfirmCloseId(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm"
            style={{ boxShadow: '0 8px 0 0 #E5E5E5' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#FEE2E2' }}>
              <X size={22} color="#DC2626" />
            </div>
            <h3 className="font-black text-lg text-center mb-2" style={{ color: '#101828' }}>Close Campaign?</h3>
            <p className="text-sm text-center text-gray-400 mb-6">
              This will stop new applications. Existing applicants won't be affected. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCloseId(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-black border border-gray-200 text-gray-600">
                Cancel
              </button>
              <button onClick={() => { handleClose(confirmCloseId); setConfirmCloseId(null); }}
                className="flex-1 py-3 rounded-2xl text-sm font-black text-white"
                style={{ backgroundColor: '#DC2626', boxShadow: '0 3px 0 0 #991B1B' }}>
                Yes, Close It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOpenings;
