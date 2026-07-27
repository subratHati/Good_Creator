import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import useAuth from './useAuth';

// shared fetch/shape logic used by both NotificationBell (dropdown) and
// any full-panel notification list (e.g. BrandHome sidebar).
// This hook does NOT touch seen/unread localStorage state — callers that
// need "mark as seen" behavior (like NotificationBell) handle that themselves.
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
      const items = [];

      if (user.role === 'creator') {
        const enquiryRes = await axiosInstance.get('/enquiries/received');
        const enquiries = enquiryRes.data.enquiries || [];
        enquiries.forEach((e) => {
          items.push({
            id: e._id,
            type: 'enquiry',
            title: `${e.brandId?.brandName || 'A brand'} sent you an enquiry`,
            preview: e.message?.slice(0, 60) + (e.message?.length > 60 ? '...' : ''),
            time: e.createdAt,
            action: { path: '/creator/enquiries' },
          });
        });

        const appRes = await axiosInstance.get('/applications/my');
        const apps = appRes.data.applications || [];
        apps.filter(a => a.status === 'shortlisted' || a.status === 'viewed').forEach((a) => {
          items.push({
            id: a._id + '_app',
            type: 'application',
            title: a.status === 'shortlisted'
              ? `🎉 ${a.brandId?.brandName || 'Brand'} shortlisted you`
              : `${a.brandId?.brandName || 'Brand'} viewed your application`,
            preview: a.openingId?.title || 'Opening',
            time: a.updatedAt || a.createdAt,
            action: { path: '/creator/applications' },
          });
        });
      }

      if (user.role === 'brand') {
        const openingsRes = await axiosInstance.get('/openings/my');
        const openings = openingsRes.data.openings || [];

        for (const opening of openings.slice(0, 5)) {
          try {
            const appRes = await axiosInstance.get(`/applications/opening/${opening._id}`);
            const apps = appRes.data.applications || [];
            const pending = apps.filter(a => a.status === 'pending');
            if (pending.length > 0) {
              const newestApp = pending[0];
              items.push({
                id: opening._id + '_apps',
                type: 'application',
                title: `${pending.length} new application${pending.length > 1 ? 's' : ''} on "${opening.title}"`,
                preview: pending.map(a => a.creatorId?.name || 'Creator').slice(0, 2).join(', '),
                time: newestApp.createdAt,
                action: { path: `/brand/openings/${opening._id}/applicants` },
              });
            }
          } catch {
            // skip this opening, don't fail the whole list
          }
        }
      }

      // admin-sent notifications apply to both creators and brands
      try {
        const adminNotifRes = await axiosInstance.get('/notifications/my');
        const adminNotifs = adminNotifRes.data.notifications || [];
        adminNotifs.forEach((n) => {
          items.push({
            id: n._id,
            type: 'admin',
            title: n.title,
            preview: n.message,
            time: n.createdAt,
            action: { path: n.actionPath || '/' },
          });
        });
      } catch {
        // don't let a failed admin-notifications fetch break the whole list
      }

      items.sort((a, b) => new Date(b.time) - new Date(a.time));
      setNotifications(items.slice(0, limit));
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
