import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getMyOpenings, deleteOpening } from '../../api/openings';
import toast from 'react-hot-toast';

const statusStyles = {
  active: { bg: '#F0FDF4', color: '#166534', dot: '#22C55E' },
  closed: { bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
  draft: { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
};

const ManageOpenings = () => {
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmCloseId, setConfirmCloseId] = useState(null);
  const [selectedOpening, setSelectedOpening] = useState(null);

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
          <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      </div>
    );
  }

  const active = openings.filter(o => o.status === 'active').length;
  const draft = openings.filter(o => o.status === 'draft').length;
  const closed = openings.filter(o => o.status === 'closed').length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8FAFC', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-10">

          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate" style={{ color: '#101828' }}>My Campaigns</h1>
              <p className="text-sm mt-0.5 truncate" style={{ color: '#9CA3AF' }}>Manage your collab opportunities</p>
            </div>
            <Link
              to="/brand/openings/create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-opacity flex-shrink-0 whitespace-nowrap"
              style={{ backgroundColor: '#155DFC' }}
            >
              <Plus size={15} /> New Campaign
            </Link>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Active', count: active },
              { label: 'Draft', count: draft },
              { label: 'Closed', count: closed },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
                <div className="text-2xl font-bold" style={{ color: '#101828' }}>{s.count}</div>
                <div className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color: '#9CA3AF' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* empty state */}
          {openings.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#E5E7EB' }}>
              <div className="text-4xl mb-4">📋</div>
              <div className="font-bold mb-2" style={{ color: '#101828' }}>No campaigns yet</div>
              <div className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Create your first campaign to start receiving applications from creators.</div>
              <Link
                to="/brand/openings/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#155DFC' }}
              >
                <Plus size={15} /> Create Campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {openings.map(opening => {
                const st = statusStyles[opening.status] || statusStyles.closed;

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
                  <div
                    key={opening._id}
                    onClick={() => setSelectedOpening(opening)}
                    className="bg-white rounded-2xl border overflow-hidden cursor-pointer transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <div className="p-4 md:p-5">

                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-base truncate" style={{ color: '#101828' }}>{opening.title}</h3>
                            <span
                              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0"
                              style={{ backgroundColor: st.bg, color: st.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                              {opening.status}
                            </span>
                            {opening.isBarter && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}>
                                Barter
                              </span>
                            )}
                          </div>
                          {opening.description && (
                            <p className="text-xs line-clamp-1" style={{ color: '#9CA3AF' }}>{opening.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            to={`/brand/openings/${opening._id}/applicants`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-blue-100"
                            style={{ backgroundColor: '#EFF6FF', color: '#155DFC' }}
                          >
                            <Users size={12} /> Applicants
                          </Link>
                          {opening.status !== 'closed' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmCloseId(opening._id); }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-red-100"
                              style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                            >
                              <X size={12} /> Close
                            </button>
                          )}
                        </div>
                      </div>

                      {delBoxes.length > 0 && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {delBoxes.map((b, i) => (
                            <div key={i} className="rounded-lg px-3 py-1.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                              <span className="text-xs font-semibold" style={{ color: '#374151' }}>{b.qty} {b.type}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-lg px-3 py-1.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                          <span className="text-xs font-semibold" style={{ color: '#101828' }}>
                            {opening.budgetMin > 0 && opening.budgetMax > 0
                              ? `₹${opening.budgetMin.toLocaleString('en-IN')} – ₹${opening.budgetMax.toLocaleString('en-IN')}`
                              : opening.budgetMax > 0
                                ? `Up to ₹${opening.budgetMax.toLocaleString('en-IN')}`
                                : opening.isBarter ? 'Barter only' : 'Budget TBD'
                            }
                          </span>
                        </div>

                        {opening.deadline && (
                          <div className="rounded-lg px-3 py-1.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                            <span className="text-xs" style={{ color: '#6B7280' }}>
                              Due {new Date(opening.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        )}

                        {opening.requirements?.minFollowers > 0 && (
                          <div className="rounded-lg px-3 py-1.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                            <span className="text-xs" style={{ color: '#6B7280' }}>
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setConfirmCloseId(null)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FEF2F2' }}>
              <X size={22} color="#DC2626" />
            </div>
            <h3 className="font-bold text-lg text-center mb-2" style={{ color: '#101828' }}>Close Campaign?</h3>
            <p className="text-sm text-center mb-6" style={{ color: '#9CA3AF' }}>
              This will stop new applications. Existing applicants won't be affected. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCloseId(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { handleClose(confirmCloseId); setConfirmCloseId(null); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#DC2626' }}
              >
                Yes, close it
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOpening && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4"
          onClick={() => setSelectedOpening(null)}
        >
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg overflow-y-auto"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />

              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="text-lg font-bold" style={{ color: '#101828' }}>{selectedOpening.title}</h2>
                <button onClick={() => setSelectedOpening(null)} style={{ color: '#9CA3AF' }}>
                  <X size={20} />
                </button>
              </div>

              {(() => {
                const st = statusStyles[selectedOpening.status] || statusStyles.closed;
                return (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize mb-4"
                    style={{ backgroundColor: st.bg, color: st.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                    {selectedOpening.status}
                  </span>
                );
              })()}

              {selectedOpening.description && (
                <p className="text-sm mb-5" style={{ color: '#6B7280' }}>{selectedOpening.description}</p>
              )}

              {/* deliverables */}
              {(() => {
                const d = selectedOpening.deliverables || {};
                const boxes = [
                  { type: 'Reel', qty: d.reels || 0 },
                  { type: 'Post', qty: d.posts || 0 },
                  { type: 'Story', qty: d.stories || 0 },
                  { type: 'UGC', qty: d.ugc || 0 },
                ].filter(b => b.qty > 0);
                if (boxes.length === 0) return null;
                return (
                  <div className="mb-5">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>Deliverables</div>
                    <div className="flex gap-2 flex-wrap">
                      {boxes.map((b, i) => (
                        <div key={i} className="rounded-xl px-4 py-2.5 text-center" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                          <div className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>{b.type}</div>
                          <div className="text-lg font-bold" style={{ color: '#101828' }}>{b.qty}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* preferred niches */}
              {selectedOpening.requirements?.categories?.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>Preferred Niches</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedOpening.requirements.categories.map(c => (
                      <span key={c} className="text-xs font-semibold px-3 py-1 rounded-full capitalize" style={{ backgroundColor: '#F8FAFC', color: '#374151', border: '1px solid #E5E7EB' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* creator requirements */}
              {(selectedOpening.requirements?.minFollowers > 0 || selectedOpening.requirements?.minEngagement > 0) && (
                <div className="mb-5">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>Creator Requirements</div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedOpening.requirements?.minFollowers > 0 && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F8FAFC', color: '#374151', border: '1px solid #E5E7EB' }}>
                        Min {selectedOpening.requirements.minFollowers.toLocaleString('en-IN')} followers
                      </span>
                    )}
                    {selectedOpening.requirements?.minEngagement > 0 && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F8FAFC', color: '#374151', border: '1px solid #E5E7EB' }}>
                        Min {selectedOpening.requirements.minEngagement}% engagement
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* budget */}
              <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#78350F' }}>Budget</div>
                <div className="text-lg font-bold" style={{ color: '#0F172A' }}>
                  {selectedOpening.budgetMin > 0 && selectedOpening.budgetMax > 0
                    ? `₹${selectedOpening.budgetMin.toLocaleString('en-IN')} – ₹${selectedOpening.budgetMax.toLocaleString('en-IN')}`
                    : selectedOpening.budgetMax > 0
                      ? `Up to ₹${selectedOpening.budgetMax.toLocaleString('en-IN')}`
                      : selectedOpening.isBarter ? 'Barter only' : 'Budget TBD'
                  }
                </div>
                {selectedOpening.isBarter && selectedOpening.barterDetails && (
                  <div className="text-xs mt-1" style={{ color: '#92400E' }}>Barter: {selectedOpening.barterDetails}</div>
                )}
              </div>

              {selectedOpening.deadline && (
                <div className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
                  Deadline: {new Date(selectedOpening.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}

              <button
                onClick={() => setSelectedOpening(null)}
                className="w-full py-3 rounded-xl text-sm font-semibold border"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOpenings;
