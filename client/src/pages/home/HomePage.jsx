import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LandingPage from './LandingPage';
import CreatorHome from './CreatorHome';
import BrandHome from './BrandHome';

const HomePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LandingPage />;
  if (user.role === 'creator') return <CreatorHome />;
  if (user.role === 'brand') return <BrandHome />;

  return <Navigate to="/login" replace />;
};

export default HomePage;
