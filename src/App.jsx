import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SessionProvider } from './contexts/SessionContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { SignUpChoicePage } from './pages/SignUpChoicePage';
import { SignUpClientPage } from './pages/SignUpClientPage';
import { SignUpAgencyPage } from './pages/SignUpAgencyPage';
import { SearchPage } from './pages/SearchPage';
import { VehicleDetailsPage } from './pages/VehicleDetailsPage';
import { BookingPage } from './pages/BookingPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { UserBookingsPage } from './pages/dashboard/UserBookingsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { AgencyDashboardPage } from './pages/agency/AgencyDashboardPage';
import { AgencyVehiclesPage } from './pages/agency/AgencyVehiclesPage';
import { AgencyOnboardingPage } from './pages/agency/AgencyOnboardingPage';
import { AgencySettingsPage } from './pages/dashboard/AgencySettingsPage';
import { AgencyBookingsPage } from './pages/agency/AgencyBookingsPage';
import { AgencyCalendarPage } from './pages/agency/AgencyCalendarPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { UserDetailsPage } from './pages/admin/UserDetailsPage';
import { AdminAgencyDetailsPage } from './pages/admin/AdminAgencyDetailsPage';
import { MessagesPage } from './pages/dashboard/MessagesPage';
import { LocationManagementPage } from './pages/admin/LocationManagementPage';
import { AdminFinancesPage } from './pages/admin/AdminFinancesPage';
import { generateInvoicePdf } from './lib/invoiceGenerator';

function App() {
    return (
        <LanguageProvider>
            <Router>
                <SessionProvider>
                    <AuthProvider>
                        <ProfileProvider>
                            <div className="flex flex-col min-h-screen">
                                <Navbar />
                                <main className="flex-grow">
                                    <Routes>
                                        <Route path="/" element={<HomePage />} />
                                        <Route path="/login" element={<LoginPage />} />
                                        <Route path="/signup" element={<SignUpPage />} />
                                        <Route path="/signup-choice" element={<SignUpChoicePage />} />
                                        <Route path="/signup-client" element={<SignUpClientPage />} />
                                        <Route path="/signup-agency" element={<SignUpAgencyPage />} />
                                        <Route path="/search" element={<SearchPage />} />
                                        <Route path="/vehicle/:id" element={<VehicleDetailsPage />} />
                                        <Route path="/book/:vehicleId" element={<BookingPage />} />
                                        <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmationPage generateInvoice={generateInvoicePdf} />} />
                                        <Route path="/update-password" element={<UpdatePasswordPage />} />
                                        
                                        {/* User Dashboard */}
                                        <Route path="/dashboard/bookings" element={<UserBookingsPage generateInvoice={generateInvoicePdf} />} />
                                        <Route path="/profile" element={<ProfilePage />} />
                                        <Route path="/dashboard/messages" element={<MessagesPage />} />

                                        {/* Agency Dashboard */}
                                        <Route path="/dashboard/agency" element={<AgencyDashboardPage />} />
                                        <Route path="/dashboard/agency/vehicles" element={<AgencyVehiclesPage />} />
                                        <Route path="/dashboard/agency/bookings" element={<AgencyBookingsPage />} />
                                        <Route path="/dashboard/agency/calendar" element={<AgencyCalendarPage />} />
                                        <Route path="/dashboard/agency/settings" element={<AgencySettingsPage />} />
                                        <Route path="/agency-onboarding" element={<AgencyOnboardingPage />} />

                                        {/* Admin Dashboard */}
                                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                                        <Route path="/admin/users" element={<UserManagementPage />} />
                                        <Route path="/admin/users/:userId" element={<UserDetailsPage />} />
                                        <Route path="/admin/agency-details/:agencyId" element={<AdminAgencyDetailsPage />} />
                                        <Route path="/admin/locations" element={<LocationManagementPage />} />
                                        <Route path="/admin/finances" element={<AdminFinancesPage />} />
                                    </Routes>
                                </main>
                                <Footer />
                            </div>
                        </ProfileProvider>
                    </AuthProvider>
                </SessionProvider>
            </Router>
        </LanguageProvider>
    );
}

export default App;
