import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { getDeletedAccounts } from '../../api/account';
import { DELETE_REASONS } from '../../utils/deleteReasons';

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

const reasonLabel = (value) =>
  DELETE_REASONS.find((r) => r.value === value)?.label || value || '';

const AdminDeletedAccounts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/', { replace: true });
  }, [user, navigate]);

  const fetchPage = async (roleValue, pageNum, append) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = { page: pageNum, limit: 30 };
      if (roleValue) params.role = roleValue;
      const res = await getDeletedAccounts(params);
      const { accounts: list = [], total: t = 0, pages: p = 1 } = res.data;
      setAccounts((prev) => (append ? [...prev, ...list] : list));
      setTotal(t);
      setPages(p);
      setPage(pageNum);
    } catch {
      toast.error('Failed to load deleted accounts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchPage('', 1, false); }, []);

  const changeRole = (value) => {
    setRole(value);
    fetchPage(value, 1, false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="sticky top-0 z-20" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            aria-label="Back"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-black text-white">Deleted Accounts</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex gap-2">
            {[
              { v: '', l: 'All' },
              { v: 'creator', l: 'Creators' },
              { v: 'brand', l: 'Brands' },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => changeRole(f.v)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                style={{
                  backgroundColor: role === f.v ? '#101828' : 'white',
                  color: role === f.v ? 'white' : '#6B7280',
                  borderColor: role === f.v ? '#101828' : '#E5E7EB',
                }}
              >
                {f.l}
              </button>
            ))}
          </div>
          <div className="text-xs font-semibold" style={{ color: '#6B7280' }}>{total} total</div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Loading…</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>No deleted accounts yet.</div>
        ) : (
          <div className="space-y-3">
            {accounts.map((a) => (
              <div key={a._id} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black" style={{ color: '#101828' }}>{a.name || 'Unknown'}</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          backgroundColor: a.role === 'brand' ? '#EFF6FF' : '#F5F3FF',
                          color: a.role === 'brand' ? '#1E3A8A' : '#4C1D95',
                        }}
                      >
                        {a.role}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: '#9CA3AF' }}>
                      {a.maskedEmail || 'email not recorded'} · {formatDate(a.deletedAt)}
                    </div>
                  </div>
                </div>

                {a.reasonCategory || a.reasonText ? (
                  <div className="mt-3">
                    {a.reasonCategory && (
                      <span
                        className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2"
                        style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
                      >
                        {reasonLabel(a.reasonCategory)}
                      </span>
                    )}
                    {a.reasonText && (
                      <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{a.reasonText}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm italic" style={{ color: '#9CA3AF' }}>No reason given</p>
                )}

                {a.cleanupFailed && a.cleanupFailed.length > 0 && (
                  <div
                    className="mt-3 flex items-start gap-2 text-xs rounded-xl px-3 py-2"
                    style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}
                  >
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Cleanup incomplete for: {a.cleanupFailed.join(', ')}. Check the server logs.</span>
                  </div>
                )}
              </div>
            ))}

            {page < pages && (
              <button
                onClick={() => fetchPage(role, page + 1, true)}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl text-sm font-bold border bg-white"
                style={{ borderColor: '#E5E7EB', color: '#374151' }}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDeletedAccounts;