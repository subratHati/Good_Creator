import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import useAuth from './useAuth';

// Thin wrapper around GET /notifications/my — the same single source of
// truth NotificationsPage.jsx uses. Both the bell dropdown and any
// embedded notification card (e.g. BrandHome's sidebar) now read from
// the one real, persisted Notification collection, instead of each
// re-deriving its own list live from applications/openings — those
// events now write a Notification record directly (via createNotification
// in notification.controller.js) at the moment they happen, so this hook
// no longer needs to reconstruct anything on the fly.
const useNotifications = ({ limit = 10, pollIntervalMs = 60000 } = {}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      const res = await axiosInstance.get('/notifications/my', { params: { page: 1, limit } });
      const items = (res.data.notifications || []).map((n) => ({
        id: n._id,
        type: n.type,
        title: n.title,
        preview: n.message,
        time: n.createdAt,
        isRead: n.isRead,
        action: { path: n.actionPath || '/' },
      }));
      setNotifications(items);
    } catch {
      // silent — leave previous notifications in place rather than clearing them
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchNotifications();
    if (!pollIntervalMs) return;
    const interval = setInterval(fetchNotifications, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollIntervalMs]);

  return { notifications, loading, refetch: fetchNotifications };
};

export default useNotifications;