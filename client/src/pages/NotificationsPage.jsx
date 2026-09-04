import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, X, Megaphone, Briefcase } from 'lucide-react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const AdminMessageModal = ({ notification, onClose, onNavigate }) => {
  const hasRealAction = notification.actionPath && notification.actionPath !== '/';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 flex items-start gap-3" style={{ backgroundColor: '#EFF6FF' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#DBEAFE' }}>
            <Megaphone size={18} color="#1D4ED8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#1D4ED8' }}>GoodCreator</div>
            <h3 className="font-black text-lg" style={{ color: '#101828' }}>{notification.title}</h3>
          </div>
          <button onClick={onClose} className="flex-shrink-0" style={{ color: '#93B4FD' }}>
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed">{notification.message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold border"
            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            Close
          </button>
          {hasRealAction && (
            <button
              onClick={() => onNavigate(notification.actionPath)}
              className="flex-1 py-3 rounded-xl text-sm font-black text-white"
              style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
            >
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedAdminNotif, setSelectedAdminNotif] = useState(null);

  const fetchPage = async (pg) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await axiosInstance.get('/notifications/my', { params: { page: pg, limit: 10 } });
      const newItems = res.data.notifications || [];
      setNotifications(prev => pg === 1 ? newItems : [...prev, ...newItems]);
      setHasMore(res.data.pagination?.hasMore ?? false);
      setPage(pg);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchPage(1); }, []);

  const markRead = async (id) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {
      // non-critical — don't block navigation if this fails
    }
  };

  const handleClick = (n) => {
    if (!n.isRead) markRead(n._id);

    if (n.type === 'admin') {
      setSelectedAdminNotif(n);
    } else {
      navigate(n.actionPath || '/');
    }
  };

  const handleModalNavigate = (path) => {
    setSelectedAdminNotif(null);
    navigate(path);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Navbar />
      <div className="bg-white border-b sticky top-14 z-10" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold" style={{ color: '#101828' }}>Notifications</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#E5E7EB' }}>
            <Bell size={32} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
            <div className="font-bold text-sm mb-1" style={{ color: '#101828' }}>All caught up!</div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>New activity will show up here.</div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
                {notifications.map(n => (
                  <button
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className="w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                    style={{ backgroundColor: n.isRead ? 'white' : '#F8FAFF' }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: n.type === 'admin' ? '#EFF6FF' : '#F0FDF4' }}>
                      {n.type === 'admin'
                        ? <Megaphone size={15} color="#1D4ED8" />
                        : <Briefcase size={15} color="#16A34A" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#155DFC' }} />}
                        <div className="text-sm font-bold truncate" style={{ color: '#101828' }}>{n.title}</div>
                      </div>
                      {n.message && (
                        <div className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6B7280' }}>{n.message}</div>
                      )}
                      <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{timeAgo(n.createdAt)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {hasMore && (
              <div className="text-center mt-4">
                <button
                  onClick={() => fetchPage(page + 1)}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold border disabled:opacity-60"
                  style={{ borderColor: '#155DFC', color: '#155DFC' }}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedAdminNotif && (
        <AdminMessageModal
          notification={selectedAdminNotif}
          onClose={() => setSelectedAdminNotif(null)}
          onNavigate={handleModalNavigate}
        />
      )}
    </div>
  );
};

export default NotificationsPage;
