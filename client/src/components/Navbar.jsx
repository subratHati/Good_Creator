import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, User } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const creatorLinks = [
    { label: 'Dashboard', path: '/creator/dashboard' },
    { label: 'Browse Brands', path: '/creator/browse-brands' },
    { label: 'My Applications', path: '/creator/applications' },
    { label: 'Profile', path: '/creator/profile' },
  ];

  const brandLinks = [
    { label: 'Dashboard', path: '/brand/dashboard' },
    { label: 'Browse Creators', path: '/brand/browse-creators' },
    { label: 'My Openings', path: '/brand/openings' },
    { label: 'Profile', path: '/brand/profile' },
  ];

  const links = user?.role === 'creator' ? creatorLinks : brandLinks;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* logo */}
        <Link to={`/${user?.role}/dashboard`} className="text-xl font-bold text-gray-900">
          Collab<span className="text-blue-600">Space</span>
        </Link>

        {/* nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* right side */}
        <div className="flex items-center gap-3">
          {/* role badge */}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            user?.role === 'creator'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {user?.role}
          </span>

          {/* notification bell */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={18} />
          </button>

          {/* profile icon */}
          <Link
            to={`/${user?.role}/profile`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <User size={18} />
          </Link>

          {/* logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;