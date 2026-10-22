import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminChatList from './pages/admin/AdminChatList';
import AdminChatWindow from './pages/admin/AdminChatWindow';
import PrivacyPolicy from './pages/PrivacyPolicy'; // use the path where you saved the file

const MessagesPage = lazy(() => import('./pages/messages/MessagesPage'));
const ChatWindow = lazy(() => import('./pages/messages/ChatWindow'));
const AssistantChatWindow = lazy(() => import('./pages/messages/AssistantChatWindow'));
const ContactHelp = lazy(() => import('./pages/ContactHelp'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CollaborationHistoryPage = lazy(() => import('./pages/CollaborationHistoryPage'));



// auth
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const InstagramCallback = lazy(() => import('./pages/auth/InstagramCallback'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

//Navbar
import BottomNav from './components/BottomNav';

// creator
const CreatorDashboard = lazy(() => import('./pages/creator/CreatorDashboard'));
const CreatorProfile = lazy(() => import('./pages/creator/CreatorProfile'));
const BrowseBrands = lazy(() => import('./pages/creator/BrowseBrands'));
const MyApplications = lazy(() => import('./pages/creator/MyApplications'));
const BankDetails = lazy(() => import('./pages/creator/BankDetails'));
const CampaignDetails = lazy(() => import('./pages/creator/CampaignDetails'));
const PaymentDashboard = lazy(() => import('./pages/creator/PaymentDashboard'));


// brand
const BrandDashboard = lazy(() => import('./pages/brand/BrandDashboard'));
const BrandProfile = lazy(() => import('./pages/brand/BrandProfile'));
const BrowseCreators = lazy(() => import('./pages/brand/BrowseCreators'));
const CreateOpening = lazy(() => import('./pages/brand/CreateOpening'));
const ManageOpenings = lazy(() => import('./pages/brand/ManageOpenings'));
const ViewApplicants = lazy(() => import('./pages/brand/ViewApplicants'));
const SavedCreators = lazy(() => import('./pages/brand/SavedCreators'));
const BrandTransactionHistory = lazy(() => import('./pages/brand/BrandTransactionHistory'));

//public
const CreatorPublicProfile = lazy(() => import('./pages/public/CreatorPublicProfile'));
const BrandPublicProfile = lazy(() => import('./pages/public/BrandPublicProfile'));
const HomePage = lazy(() => import('./pages/home/HomePage'));

// admin 
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminIssues = lazy(() => import('./pages/admin/AdminIssues'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

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
            <Route path="/creator/bank-details" element={
              <ProtectedRoute allowedRole="creator" > <BankDetails /> </ProtectedRoute>
            } />
            <Route path="/creator/payments" element={
              <ProtectedRoute allowedRole="creator"><PaymentDashboard /></ProtectedRoute>
            } />
            <Route path="/openings/:id" element={
              <ProtectedRoute allowedRole="creator"><CampaignDetails /></ProtectedRoute>
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
            <Route path="/brand/transactions" element={
              <ProtectedRoute allowedRole="brand"><BrandTransactionHistory /></ProtectedRoute>
            } />

            <Route path="/messages" element={
              <ProtectedRoute><MessagesPage /></ProtectedRoute>
            } />
            <Route path="/messages/:id" element={
              <ProtectedRoute><ChatWindow /></ProtectedRoute>
            } />
            <Route path="/messages/admin/:id" element={
              <ProtectedRoute><AdminChatWindow /></ProtectedRoute>
            } />

            <Route path="/messages/assistant" element={
              <ProtectedRoute><AssistantChatWindow /></ProtectedRoute>
            } />

            <Route path="/contact-help" element={
              <ProtectedRoute><ContactHelp /></ProtectedRoute>
            } />

            <Route path="/notifications" element={
              <ProtectedRoute><NotificationsPage /></ProtectedRoute>
            } />

            <Route path="/collaborations" element={
              <ProtectedRoute><CollaborationHistoryPage /></ProtectedRoute>
            } />

            {/* Admin  */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRole="admin" loginPath="/admin/login"><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute allowedRole="admin" loginPath="/admin/login"><AdminPayments /></ProtectedRoute>
            } />
            <Route path="/admin/issues" element={
              <ProtectedRoute allowedRole="admin" loginPath="/admin/login"><AdminIssues /></ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRole="admin" loginPath="/admin/login"><AdminAnalytics /></ProtectedRoute>
            } />

            <Route path="/admin/chat" element={
              <ProtectedRoute allowedRole="admin" loginPath="/admin/login"><AdminChatList /></ProtectedRoute>
            } />

            <Route path="/admin/chat/:id" element={
              <ProtectedRoute allowedRole="admin" loginPath="/admin/login"><AdminChatWindow /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;