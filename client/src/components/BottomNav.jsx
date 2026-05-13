import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getUnreadCount } from '../api/chat';
import { getMyCreatorProfile } from '../api/creator';
import { getMyBrandProfile } from '../api/brand';

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const DiscoverIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ApplicationsIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CampaignsIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MessagesIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileExists, setProfileExists] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.data.unreadCount);
      } catch { }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        if (user.role === 'creator') await getMyCreatorProfile();
        else await getMyBrandProfile();
        setProfileExists(true);
      } catch {
        setProfileExists(false);
      }
    };
    check();
  }, [user]);

  useEffect(() => {
    const handler = () => setProfileExists(true);
    window.addEventListener('profileCreated', handler);
    return () => window.removeEventListener('profileCreated', handler);
  }, []);

  if (!user) return null;
  if (!profileExists) return null;

  const creatorTabs = [
    { label: 'Home', path: '/', icon: HomeIcon },
    { label: 'Discover', path: '/creator/browse-brands', icon: DiscoverIcon },
    { label: 'Messages', path: '/messages', icon: MessagesIcon },
    { label: 'Applied', path: '/creator/applications', icon: ApplicationsIcon },
    { label: 'Profile', path: '/creator/profile', icon: ProfileIcon },
  ];

  const brandTabs = [
    { label: 'Home', path: '/', icon: HomeIcon },
    { label: 'Discover', path: '/brand/browse-creators', icon: DiscoverIcon },
    { label: 'Messages', path: '/messages', icon: MessagesIcon },
    { label: 'Campaigns', path: '/brand/openings', icon: CampaignsIcon },
    { label: 'Profile', path: '/brand/profile', icon: ProfileIcon },
  ];

  const tabs = user.role === 'creator' ? creatorTabs : brandTabs;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="hide-on-desktop"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'white',
        borderTop: '1px solid #E5E7EB',
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: 'translate3d(0,0,0)',
        WebkitTransform: 'translate3d(0,0,0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div style={{
        display: 'flex',
        height: '60px',
        width: '100%',
        overflowX: 'hidden', // prevent horizontal scroll
        overflowY: 'hidden',
      }}>
        {tabs.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          const isMessages = label === 'Messages';
          const hasUnread = isMessages && unreadCount > 0;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: hasUnread ? 'white' : active ? '#101828' : '#9CA3AF',
                padding: '0 4px',
                minWidth: 0, // allow shrinking
              }}
            >
              <div style={{
                position: 'relative',
                backgroundColor: hasUnread ? '#EF4444' : 'transparent',
                borderRadius: '12px',
                padding: hasUnread ? '4px 8px' : '0',
                transition: 'all 0.2s',
              }}>
                <Icon active={active} />
                {hasUnread && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    backgroundColor: 'white',
                    color: '#EF4444',
                    fontSize: '9px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '1px 4px',
                    minWidth: '16px',
                    textAlign: 'center',
                    lineHeight: '14px',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
