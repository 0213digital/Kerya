import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// PDF Generation
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
import { LocationManagementPage } from './pages/admin/LocationManagementPage';

const generateInvoice = async (booking, t) => {
    if (!booking?.profiles || !booking?.vehicles?.agencies) {
        console.error("Booking data is incomplete for invoice generation.", booking);
        alert("Sorry, booking data is incomplete for the invoice.");
        return;
    }

    try {
        const doc = new jsPDF();
        const logoUrl = "https://amupkaaxnypendorkkrz.supabase.co/storage/v1/object/public/webpics/public/Lo1.png";

        try {
            const response = await fetch(logoUrl);
            if (!response.ok) throw new Error('Logo response not ok');
            const blob = await response.blob();
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            // The last two numbers control the width and height of the logo.
            // I've changed them from 40, 15 to 30, 11.25 to make the logo smaller.
            doc.addImage(dataUrl, 'PNG', 19, 12, 32, 24.5);
        } catch (logoError) {
            console.warn("Could not load company logo for PDF. Skipping. Error:", logoError);
        }

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(t('invoice'), 196, 22, { align: 'right' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${t('bookingId')}: #${booking.id}`, 196, 30, { align: 'right' });
        doc.text(`${t('date')}: ${new Date().toLocaleDateString(t('locale'))}`, 196, 35, { align: 'right' });

        doc.setLineWidth(0.5);
        doc.line(14, 45, 196, 45);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(t('rentedFrom'), 14, 55);
        doc.text(t('rentedBy'), 110, 55);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(booking.vehicles.agencies.agency_name || 'N/A', 14, 62);
        doc.text(`${booking.vehicles.agencies.city || ''}, ${booking.vehicles.agencies.wilaya || ''}`, 14, 67);
        doc.text(booking.profiles.full_name || 'N/A', 110, 62);
        doc.text(booking.profiles.email || 'N/A', 110, 67);

        doc.line(14, 80, 196, 80);

        const dailyRate = typeof booking.vehicles.daily_rate_dzd === 'number' ? `${booking.vehicles.daily_rate_dzd.toLocaleString(t('locale'))} DZD` : 'N/A';
        const totalPrice = typeof booking.total_price === 'number' ? `${booking.total_price.toLocaleString(t('locale'))} DZD` : 'N/A';
        
        autoTable(doc, {
            startY: 90,
            head: [[t('description'), t('rentalPeriod'), t('dailyRate'), t('total')]],
            body: [[
                `${booking.vehicles.make || ''} ${booking.vehicles.model || ''} (${booking.vehicles.year || ''})`,
                `${new Date(booking.start_date).toLocaleDateString(t('locale'))} - ${new Date(booking.end_date).toLocaleDateString(t('locale'))}`,
                dailyRate,
                totalPrice
            ]],
            theme: 'striped',
            headStyles: { fillColor: [74, 85, 104] },
        });

        const finalY = doc.lastAutoTable.finalY || 120;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${t('totalPrice')} ${totalPrice}`, 196, finalY + 15, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(150);
        const pageCenter = doc.internal.pageSize.width / 2;
        doc.text(t('invoiceFooter'), pageCenter, 280, { align: 'center' });

        doc.save(`invoice-kerya-${booking.id}.pdf`);

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, there was an error creating the invoice PDF.");
    }
};

export default function App() {
    const { loading } = useAuth();
    const location = useLocation();
    const isUpdatePasswordPage = location.pathname === '/update-password';

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
                    <Route path="/admin/locations" element={<LocationManagementPage />} />
                </Routes>
            </main>
            {!isUpdatePasswordPage && <Footer />}
        </div>
    );
}
