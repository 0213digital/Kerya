import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTranslation } from './contexts/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Import all page components
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { VehicleDetailsPage } from './pages/VehicleDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { BookingPage } from './pages/BookingPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { UserBookingsPage } from './pages/dashboard/UserBookingsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { AgencyDashboardPage, AgencyVehiclesPage, AgencyBookingsPage, AgencyOnboardingPage, AdminDashboardPage, AdminAgencyDetailsPage } from './pages/agencyAndAdminPages';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { UserDetailsPage } from './pages/admin/UserDetailsPage';
import { MessagesPage } from './pages/dashboard/MessagesPage';
import { LocationManagementPage } from './pages/admin/LocationManagementPage'; // <-- NOUVEL IMPORT

// PDF Generation Helper (omitted for brevity)
const generateInvoice = async () => { /* ... */ };

export default function App() {
    const { loading } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();

    // This will be true if the user is on the update-password page
    const isUpdatePasswordPage = location.pathname === '/update-password';

    // Affiche un écran de chargement global tant que l'authentification n'est pas résolue
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans transition-colors duration-300 bg-slate-50">
            {!isUpdatePasswordPage && <Navbar />}
            <main className={!isUpdatePasswordPage ? "pt-20" : ""}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/vehicle/:id" element={<VehicleDetailsPage />} />
                    <Route path="/book/:vehicleId" element={<BookingPage />} />
                    <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmationPage generateInvoice={generateInvoice} />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/update-password" element={<UpdatePasswordPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/dashboard/bookings" element={<UserBookingsPage generateInvoice={generateInvoice} />} />
                    <Route path="/dashboard/messages" element={<MessagesPage />} />
                    <Route path="/dashboard/agency" element={<AgencyDashboardPage />} />
                    <Route path="/dashboard/agency/vehicles" element={<AgencyVehiclesPage />} />
                    <Route path="/dashboard/agency/bookings" element={<AgencyBookingsPage />} />
                    <Route path="/dashboard/agency/onboarding" element={<AgencyOnboardingPage />} />
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/agency-details/:id" element={<AdminAgencyDetailsPage />} />
                    <Route path="/admin/users" element={<UserManagementPage />} />
                    <Route path="/admin/users/:id" element={<UserDetailsPage />} />
                    <Route path="/admin/locations" element={<LocationManagementPage />} /> {/* <-- NOUVELLE ROUTE */}
                </Routes>
            </main>
            {!isUpdatePasswordPage && <Footer />}
        </div>
    );
}