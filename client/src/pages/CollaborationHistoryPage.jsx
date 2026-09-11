import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, IndianRupee, Calendar, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';
import { getMyCollabHistory } from '../api/collaborationHistory';
import CollabProgressGuideModal from '../components/CollabProgressGuideModal';


const STAGES = [
  { key: 'initiated', label: 'Initiated' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid_out', label: 'Paid' },
];
const stageIndex = (stage) => STAGES.findIndex((s) => s.key === stage);

const formatDeadline = (deadline) => {
  if (!deadline) return null;
  const diffDays = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Deadline passed';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return '1 day left';
  return `${diffDays} days left`;
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const ProgressBar = ({ stage, onClick }) => {
  const idx = stageIndex(stage);
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
      {STAGES.map((s, i) => (
        <div key={s.key} style={{ flex: 1 }}>
          <div style={{ height: '5px', borderRadius: '3px', backgroundColor: i <= idx ? '#155DFC' : '#E5E7EB', marginBottom: '4px' }} />
          <div style={{ fontSize: '9px', fontWeight: 700, color: i <= idx ? '#155DFC' : '#9CA3AF', textAlign: i === 0 ? 'left' : i === STAGES.length - 1 ? 'right' : 'center' }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const ActiveCollabRow = ({ collab, onProgressClick }) => {
  const deadlineText = formatDeadline(collab.deadline);
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1.5px solid #E5E7EB', boxShadow: '0 2px 0 0 #F0F0F0' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
          {collab.otherPartyImage ? (
            <img src={collab.otherPartyImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-black text-sm" style={{ color: '#155DFC' }}>{collab.otherPartyName?.[0]?.toUpperCase() || '?'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm truncate" style={{ color: '#101828' }}>{collab.otherPartyName}</div>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#9CA3AF' }}>
            <span className="flex items-center gap-0.5"><IndianRupee size={11} />{collab.amount?.toLocaleString('en-IN')}</span>
            {deadlineText && <span className="flex items-center gap-0.5"><Calendar size={11} />{deadlineText}</span>}
          </div>
        </div>
      </div>
      <ProgressBar stage={collab.stage} onClick={() => onProgressClick(collab.stage)} />
    </div>
  );
};

const CompletedCollabRow = ({ collab, role }) => {
  const badgeText = role === 'creator'
    ? `Collab completed ₹${collab.amount?.toLocaleString('en-IN')} received`
    : `Collab completed collab amount ${collab.amount?.toLocaleString('en-IN')} Rupees`;
  return (
    <div className="rounded-2xl p-4 opacity-60" style={{ border: '1.5px solid #F0F0F0', backgroundColor: '#FAFAFA' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F3F4F6' }}>
          {collab.otherPartyImage ? (
            <img src={collab.otherPartyImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-black text-sm" style={{ color: '#6B7280' }}>{collab.otherPartyName?.[0]?.toUpperCase() || '?'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm truncate" style={{ color: '#374151' }}>{collab.otherPartyName}</div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(collab.paidAt)}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', width: 'fit-content' }}>
        <CheckCircle2 size={13} color="#16A34A" />
        <span className="text-xs font-bold" style={{ color: '#166534' }}>{badgeText}</span>
      </div>
    </div>
  );
};

const CollaborationHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [active, setActive] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guideStage, setGuideStage] = useState(null);

  useEffect(() => {
    getMyCollabHistory()
      .then((res) => {
        setActive(res.data.active || []);
        setCompleted(res.data.completed || []);
      })
      .catch(() => {
        setActive([]);
        setCompleted([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Navbar />
      <div className="bg-white border-b sticky top-14 z-10" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold" style={{ color: '#101828' }}>Collaborations</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
          </div>
        ) : active.length === 0 && completed.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-3xl mb-3">🤝</div>
            <div className="font-black text-sm mb-1" style={{ color: '#101828' }}>No collaborations yet</div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>Active and completed collabs will show up here.</div>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#155DFC' }}>Active ({active.length})</div>
                                <div className="space-y-3">
                  {active.map((c) => <ActiveCollabRow key={c.collabId} collab={c} onProgressClick={setGuideStage} />)}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>Completed ({completed.length})</div>
                <div className="space-y-3">
                  {completed.map((c) => <CompletedCollabRow key={c.collabId} collab={c} role={user?.role} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {guideStage && (
        <CollabProgressGuideModal currentStage={guideStage} role={user?.role} onClose={() => setGuideStage(null)} />
      )}
    </div>
  );
};

export default CollaborationHistoryPage;
