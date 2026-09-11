import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, IndianRupee, Calendar } from 'lucide-react';
import { getMyCollabHistory } from '../api/collaborationHistory';
import useAuth from '../hooks/useAuth';
import CollabProgressGuideModal from './CollabProgressGuideModal';

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

const ProgressBar = ({ stage, onClick }) => {
  const idx = stageIndex(stage);
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
      {STAGES.map((s, i) => (
        <div key={s.key} style={{ flex: 1 }}>
          <div style={{ height: '5px', borderRadius: '3px', backgroundColor: i <= idx ? '#155DFC' : '#E5E7EB', marginBottom: '4px', transition: 'background-color 0.2s' }} />
          <div style={{ fontSize: '9px', fontWeight: 700, color: i <= idx ? '#155DFC' : '#9CA3AF', textAlign: i === 0 ? 'left' : i === STAGES.length - 1 ? 'right' : 'center' }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const ActiveCollabCard = ({ dark = false, emptyState = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [active, setActive] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissedCollabCards') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    getMyCollabHistory()
      .then((res) => setActive(res.data.active || []))
      .catch(() => setActive([]))
      .finally(() => setLoading(false));
  }, []);

  const dismiss = (collabId) => {
    const updated = [...dismissedIds, collabId];
    setDismissedIds(updated);
    localStorage.setItem('dismissedCollabCards', JSON.stringify(updated));
  };

  const visible = active.filter((c) => !dismissedIds.includes(c.collabId));

  if (loading) return null;
  if (visible.length === 0) return null;

  const top = visible[0];
  const deadlineText = formatDeadline(top.deadline);

   return (
    <div
      style={{
        backgroundColor: dark ? '#1C1B1B' : 'white',
        border: dark ? 'none' : '1px solid #E5E7EB',
        borderRadius: '20px',
        padding: '16px',
        marginBottom: '24px',
        boxShadow: dark ? '8px 8px 0 0 rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', overflow: 'hidden', backgroundColor: dark ? 'rgba(255,255,255,0.1)' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {top.otherPartyImage ? (
              <img src={top.otherPartyImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontWeight: 900, fontSize: '14px', color: dark ? 'white' : '#155DFC' }}>{top.otherPartyName?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: '13px', color: dark ? 'white' : '#101828', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {top.otherPartyName}
            </div>
            <div style={{ fontSize: '11px', color: dark ? 'rgba(255,255,255,0.5)' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><IndianRupee size={10} />{top.amount?.toLocaleString('en-IN')}</span>
              {deadlineText && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Calendar size={10} />{deadlineText}</span>
              )}
            </div>
          </div>
        </div>
               {top.stage === 'paid_out' ? (
          <button onClick={() => dismiss(top.collabId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.4)' : '#D1D5DB', flexShrink: 0 }}>
            <X size={16} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/collaborations')}
            style={{ fontSize: '11px', fontWeight: 700, color: dark ? '#93B4FD' : '#155DFC', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            View →
          </button>
        )}
      </div>

            <ProgressBar stage={top.stage} onClick={() => setShowGuide(true)} />

      {showGuide && (
        <CollabProgressGuideModal currentStage={top.stage} role={user?.role} onClose={() => setShowGuide(false)} />
      )}

      {visible.length > 1 && (
        <button
          onClick={() => navigate('/collaborations')}
          style={{ marginTop: '12px', width: '100%', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: dark ? '#93B4FD' : '#155DFC', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}
        >
          See more ({visible.length}) <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
};

export default ActiveCollabCard;
