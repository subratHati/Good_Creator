import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, User, LogOut, Settings } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import { getUnreadCount } from '../api/chat';
import toast from 'react-hot-toast';

const LogoutConfirmModal = ({ onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4"
    onClick={onCancel}
  >
    <div
      className="bg-white rounded-2xl p-6 w-full max-w-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <LogOut size={20} className="text-red-500" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg text-center mb-2">Log out?</h3>
      <p className="text-sm text-gray-500 text-center mb-6">
        You will be logged out of your account. You can always log back in.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
          Yes, log out
        </button>
      </div>
    </div>
  </div>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // fetch unread count
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.data.unreadCount);
      } catch { }
    };
    fetchUnread(); 
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const creatorLinks = [
    { label: 'Home', path: '/' },
    { label: 'Browse Brands', path: '/creator/browse-brands' },
    { label: 'Messages', path: '/messages' },
    { label: 'Applications', path: '/creator/applications' },
  ];

  const brandLinks = [
    { label: 'Home', path: '/' },
    { label: 'Browse Creators', path: '/brand/browse-creators' },
    { label: 'Messages', path: '/messages' },
    { label: 'Saved', path: '/brand/saved-creators' },
    { label: 'Openings', path: '/brand/openings' },
  ];

  const links = user?.role === 'creator' ? creatorLinks : brandLinks;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">

          {/* logo */}
          <Link
            to="/"
            className="text-lg md:text-xl font-bold text-gray-900 flex-shrink-0"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Good<span className="text-blue-600">Creator</span>
          </Link>

          {/* desktop nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${link.label === 'Messages' && unreadCount > 0
                    ? 'text-white bg-red-500 hover:bg-red-600'
                    : isActive(link.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {link.label === 'Messages' && unreadCount > 0 ? (
                    <span className="flex items-center gap-1.5">
                      Messages
                      <span style={{
                        backgroundColor: 'white',
                        color: '#EF4444',
                        fontSize: '10px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        padding: '1px 5px',
                        minWidth: '18px',
                        textAlign: 'center',
                      }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    </span>
                  ) : (
                    link.label
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* right side */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {user ? (
              <>
                <span className={`hidden md:block text-xs font-semibold px-3 py-1 rounded-full ${user.role === 'creator' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                  {user.role}
                </span>

                <NotificationBell />

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform hidden md:block ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-xs font-semibold text-gray-900 truncate">{user?.email}</div>
                        <div className="text-xs text-gray-400 capitalize mt-0.5">{user?.role} account</div>
                      </div>
                      <div className="p-1.5">
                        <Link
                          to={`/${user?.role}/profile`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full"
                        >
                          <User size={15} className="text-gray-400" />
                          My Profile
                        </Link>
                        <Link
                          to="/"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full"
                        >
                          <Settings size={15} className="text-gray-400" />
                          Dashboard
                        </Link>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors w-full"
                        >
                          <LogOut size={15} />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/login')} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Log in
                </button>
                <button onClick={() => navigate('/register')} className="px-3 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
                  Join free
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showLogoutModal && (
        <LogoutConfirmModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
};

export default Navbar;
