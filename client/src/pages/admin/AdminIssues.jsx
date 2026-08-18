import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { getAllIssues, updateIssueStatus } from '../../api/issue';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const categoryLabels = {
  collab_issue: 'Collab Issue',
  bug: 'Bug / Technical',
  fraud_scam: 'Fraud / Scam',
  payment_issue: 'Payment Issue',
  other: 'Other',
};

const categoryColors = {
  collab_issue: { bg: '#EFF6FF', color: '#1E3A8A' },
  bug: { bg: '#F5F3FF', color: '#4C1D95' },
  fraud_scam: { bg: '#FEF2F2', color: '#991B1B' },
  payment_issue: { bg: '#FFFBEB', color: '#92400E' },
  other: { bg: '#F3F4F6', color: '#374151' },
};

const statusStyles = {
  open: { bg: '#FEF2F2', color: '#991B1B', dot: '#DC2626', label: 'Open' },
  in_review: { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B', label: 'In Review' },
  resolved: { bg: '#F0FDF4', color: '#166534', dot: '#22C55E', label: 'Resolved' },
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const IssueCard = ({ issue, onStatusChange }) => {
  const cat = categoryColors[issue.category] || categoryColors.other;
  const st = statusStyles[issue.status] || statusStyles.open;

  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>
              {categoryLabels[issue.category] || issue.category}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              {issue.role}
            </span>
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            {issue.userId?.email || 'Unknown user'} · {formatDate(issue.createdAt)}
          </div>
        </div>
        <span
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: st.bg, color: st.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
          {st.label}
        </span>
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: '#374151' }}>{issue.message}</p>

      <div className="flex gap-2">
        {['open', 'in_review', 'resolved'].map(s => (
          <button
            key={s}
            onClick={() => onStatusChange(issue._id, s)}
            disabled={issue.status === s}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            style={{
              backgroundColor: issue.status === s ? '#101828' : 'white',
              color: issue.status === s ? 'white' : '#6B7280',
              borderColor: issue.status === s ? '#101828' : '#E5E7EB',
              cursor: issue.status === s ? 'default' : 'pointer',
            }}
          >
            Mark {statusStyles[s].label}
          </button>
        ))}
      </div>
    </div>
  );
};

const AdminIssues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const fetchIssues = async (status = statusFilter, category = categoryFilter) => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (category) params.category = category;
      const res = await getAllIssues(params);
      setIssues(res.data.issues || []);
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, []);

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    fetchIssues(value, categoryFilter);
  };

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    fetchIssues(statusFilter, value);
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await updateIssueStatus(issueId, newStatus);
      setIssues(prev => prev.map(i => i._id === issueId ? { ...i, status: newStatus } : i));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="sticky top-0 z-20" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="p-2 -ml-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <ArrowLeft size={18} />
          </button>
          <AlertTriangle size={18} color="#F87171" />
          <h1 className="font-black text-white">Reported Issues</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>Status</span>
          {[{ value: '', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'in_review', label: 'In Review' }, { value: 'resolved', label: 'Resolved' }].map(opt => (
            <button
              key={opt.value}
              onClick={() => handleStatusFilterChange(opt.value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                backgroundColor: statusFilter === opt.value ? '#101828' : 'white',
                color: statusFilter === opt.value ? 'white' : '#6B7280',
                borderColor: statusFilter === opt.value ? '#101828' : '#E5E7EB',
              }}
            >
              {opt.label}
            </button>
          ))}
          <span className="text-xs font-bold uppercase tracking-wider ml-3 mr-1" style={{ color: '#9CA3AF' }}>Category</span>
          <select
            value={categoryFilter}
            onChange={e => handleCategoryFilterChange(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white focus:outline-none"
            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            <option value="">All categories</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-3xl mb-3">✅</div>
            <div className="font-bold text-sm" style={{ color: '#101828' }}>No issues to show</div>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => (
              <IssueCard key={issue._id} issue={issue} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminIssues;
