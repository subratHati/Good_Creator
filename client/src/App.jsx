import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import MessagesPage from './pages/messages/MessagesPage';
import ChatWindow from './pages/messages/ChatWindow';

// auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import InstagramCallback from './pages/auth/InstagramCallback';
import ForgotPassword from './pages/auth/ForgotPassword';

//Navbar
import BottomNav from './components/BottomNav';

// creator
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorProfile from './pages/creator/CreatorProfile';
import BrowseBrands from './pages/creator/BrowseBrands';
import MyApplications from './pages/creator/MyApplications';
import CreatorEnquiries from './pages/creator/CreatorEnquiries';
import BankDetails from './pages/creator/BankDetails';

// brand
import BrandDashboard from './pages/brand/BrandDashboard';
import BrandProfile from './pages/brand/BrandProfile';
import BrowseCreators from './pages/brand/BrowseCreators';
import CreateOpening from './pages/brand/CreateOpening';
import ManageOpenings from './pages/brand/ManageOpenings';
import ViewApplicants from './pages/brand/ViewApplicants';
import SavedCreators from './pages/brand/SavedCreators';

//public
import CreatorPublicProfile from './pages/public/CreatorPublicProfile';
import BrandPublicProfile from './pages/public/BrandPublicProfile';
import HomePage from './pages/home/HomePage';


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* instagram oauth callback */}
          <Route path="/auth/instagram/callback" element={<InstagramCallback />} />

          {/* public profile pages */}
          <Route path="/creator/:id" element={<CreatorPublicProfile />} />
          <Route path="/brand/:id" element={<BrandPublicProfile />} />

          {/* creator */}
          <Route path="/creator/dashboard" element={
            <ProtectedRoute allowedRole="creator"><CreatorDashboard /></ProtectedRoute>
          } />
          <Route path="/creator/profile" element={
            <ProtectedRoute allowedRole="creator"><CreatorProfile /></ProtectedRoute>
          } />
          <Route path="/creator/browse-brands" element={
            <ProtectedRoute allowedRole="creator"><BrowseBrands /></ProtectedRoute>
          } />
          <Route path="/creator/applications" element={
            <ProtectedRoute allowedRole="creator"><MyApplications /></ProtectedRoute>
          } />
          <Route path="/creator/enquiries" element={
            <ProtectedRoute allowedRole="creator"><CreatorEnquiries /></ProtectedRoute>
          } />

          <Route path="/creator/bank-details" element={
           <ProtectedRoute allowedRole="creator" > <BankDetails /> </ProtectedRoute> 
            } />

          {/* brand */}
          <Route path="/brand/dashboard" element={
            <ProtectedRoute allowedRole="brand"><BrandDashboard /></ProtectedRoute>
          } />
          <Route path="/brand/profile" element={
            <ProtectedRoute allowedRole="brand"><BrandProfile /></ProtectedRoute>
          } />
          <Route path="/brand/browse-creators" element={
            <ProtectedRoute allowedRole="brand"><BrowseCreators /></ProtectedRoute>
          } />
          <Route path="/brand/openings" element={
            <ProtectedRoute allowedRole="brand"><ManageOpenings /></ProtectedRoute>
          } />
          <Route path="/brand/openings/create" element={
            <ProtectedRoute allowedRole="brand"><CreateOpening /></ProtectedRoute>
          } />
          <Route path="/brand/openings/:id/applicants" element={
            <ProtectedRoute allowedRole="brand"><ViewApplicants /></ProtectedRoute>
          } />
          <Route path="/brand/saved-creators" element={
            <ProtectedRoute allowedRole="brand"><SavedCreators /></ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute><MessagesPage /></ProtectedRoute>
          } />
          <Route path="/messages/:id" element={
            <ProtectedRoute><ChatWindow /></ProtectedRoute>
          } />


          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <BottomNav />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;