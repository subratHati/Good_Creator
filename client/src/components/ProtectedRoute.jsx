// import { Navigate } from 'react-router-dom';
// import useAuth from '../hooks/useAuth';

// const ProtectedRoute = ({ children, allowedRole }) => {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (!user) return <Navigate to="/login" replace />;

//   if (allowedRole && user.role !== allowedRole) {
//     return <Navigate to={`/${user.role}/dashboard`} replace />;
//   }

//   return children;
// };

// export default ProtectedRoute;

import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  // while auth is initializing, show nothing — don't redirect yet
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // loading is done, no user found — redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // wrong role — redirect to their own dashboard
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;