import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import { AppContext } from './contexts/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Import all page components
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { VehicleDetailsPage } from './pages/VehicleDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { BookingPage } from './pages/BookingPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { UserBookingsPage } from './pages/dashboard/UserBookingsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { AgencyDashboardPage, AgencyVehiclesPage, AgencyBookingsPage, AgencyOnboardingPage, AdminDashboardPage, AdminAgencyDetailsPage } from './pages/agencyAndAdminPages';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { UserDetailsPage } from './pages/admin/UserDetailsPage'; // Import the new page

// PDF Generation Helper (omitted for brevity)
const generateInvoice = async () => { /* ... */ };

function AppWrapper() {
    const { t } = useTranslation();
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ... (rest of AppWrapper logic remains the same)

    const fetchProfile = useCallback(async (user) => {
        if (user) {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (error) console.error('Error fetching profile:', error);
            else setProfile(data);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            fetchProfile(session?.user).finally(() => setLoading(false));
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setProfile(null);
            if (session?.user) {
                fetchProfile(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        navigate('/');
    };
    
    if (loading) return <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-800">{t('loading')}</div>;

    return (
        <AppContext.Provider value={{ session, profile, fetchProfile, handleLogout }}>
            <div className="min-h-screen font-sans transition-colors duration-300 bg-slate-50">
                <Navbar />
                <main className="pt-20">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/vehicle/:id" element={<VehicleDetailsPage />} />
                        <Route path="/book" element={<BookingPage />} />
                        <Route path="/booking-confirmation" element={<BookingConfirmationPage generateInvoice={generateInvoice} />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/dashboard/bookings" element={<UserBookingsPage generateInvoice={generateInvoice} />} />
                        <Route path="/dashboard/agency" element={<AgencyDashboardPage />} />
                        <Route path="/dashboard/agency/vehicles" element={<AgencyVehiclesPage />} />
                        <Route path="/dashboard/agency/bookings" element={<AgencyBookingsPage />} />
                        <Route path="/dashboard/agency/onboarding" element={<AgencyOnboardingPage />} />
                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                        <Route path="/admin/agency-details/:id" element={<AdminAgencyDetailsPage />} />
                        <Route path="/admin/users" element={<UserManagementPage />} />
                        {/* Add the new route for user details */}
                        <Route path="/admin/users/:id" element={<UserDetailsPage />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </AppContext.Provider>
    );
}

export default function App() { 
    return (
        <LanguageProvider>
            <BrowserRouter>
                <AppWrapper />
            </BrowserRouter>
        </LanguageProvider>
    ); 
}
