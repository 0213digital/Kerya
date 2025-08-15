import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { useSession } from './contexts/SessionContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useProfile } from './contexts/ProfileContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';

// Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import VehicleDetailsPage from './pages/VehicleDetailsPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';

// Dashboard Pages
import ProfilePage from './pages/dashboard/ProfilePage';
import UserBookingsPage from './pages/dashboard/UserBookingsPage';
import MessagesPage from './pages/dashboard/MessagesPage';
import AgencySettingsPage from './pages/dashboard/AgencySettingsPage';

// Admin Pages
import UserManagementPage from './pages/admin/UserManagementPage';
import UserDetailsPage from './pages/admin/UserDetailsPage';
import LocationManagementPage from './pages/admin/LocationManagementPage';

// Agency Pages
import {
  VehicleManagementPage,
  BookingManagementPage,
  AgencyDashboardPage,
} from './pages/agencyAndAdminPages';


// Higher-Order Component for protected routes
const ProtectedRoute = ({ children, isAllowed, redirectTo = "/login" }) => {
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

function App() {
  const { session } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const isAdmin = profile?.role === 'admin';
  const isAgency = profile?.role === 'agency';
  const isUser = session && profile;

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Toaster position="top-right" reverseOrder={false} />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/vehicle/:id" element={<VehicleDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />

            {/* User-only Routes */}
            <Route 
              path="/book/:id" 
              element={
                <ProtectedRoute isAllowed={isUser}>
                  <BookingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/confirmation" 
              element={
                <ProtectedRoute isAllowed={isUser}>
                  <BookingConfirmationPage />
                </ProtectedRoute>
              } 
            />

            {/* Dashboard Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute isAllowed={isUser}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Common dashboard routes */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="bookings" element={<UserBookingsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              
              {/* Agency Routes */}
              {isAgency && (
                <>
                  <Route index element={<AgencyDashboardPage />} />
                  <Route path="vehicles" element={<VehicleManagementPage />} />
                  <Route path="reservations" element={<BookingManagementPage />} />
                  {/* FIX: Added the missing route for agency settings */}
                  <Route path="agency/settings" element={<AgencySettingsPage />} />
                </>
              )}

              {/* Admin Routes */}
              {isAdmin && (
                <>
                  <Route index element={<UserManagementPage />} />
                  <Route path="admin/users" element={<UserManagementPage />} />
                  <Route path="admin/users/:userId" element={<UserDetailsPage />} />
                  <Route path="admin/locations" element={<LocationManagementPage />} />
                </>
              )}
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

// App Wrapper with Providers
const AppWrapper = () => (
  <LanguageProvider>
    <App />
  </LanguageProvider>
);

export default AppWrapper;
