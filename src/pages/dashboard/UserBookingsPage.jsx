import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Download, AlertTriangle, Undo } from 'lucide-react';
import { ReviewForm } from '../../components/ReviewForm';
import { BookingProgressBar } from '../../components/dashboard/BookingProgressBar';

export function UserBookingsPage({ generateInvoice }) {
    const { t } = useTranslation();
    const { session, profile } = useAuth(); // Destructure profile from useAuth
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(null);

    const handleDownload = async (booking) => {
        setProcessing(booking.id);
        await generateInvoice(booking, t);
        setProcessing(null);
    };

    const fetchBookings = useCallback(async () => {
        if (!session || !profile) return; // Wait for session and profile
        setLoading(true);
        const { data, error } = await supabase
            .from('bookings')
            .select('*, vehicles(*, agencies(*)), reviews(id)') // Simplified select statement
            .eq('user_id', session.user.id)
            .order('start_date', { ascending: false });

        if (error) {
            console.error("Error fetching bookings:", error);
            setBookings([]);
        } else {
            // Attach the user's profile to each booking for the invoice generation
            const bookingsWithProfile = data.map(booking => ({
                ...booking,
                profiles: profile
            }));
            setBookings(bookingsWithProfile || []);
        }
        setLoading(false);
    }, [session, profile]); // Add profile to dependency array

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleReturnRequest = async (bookingId) => {
        setProcessing(bookingId);
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'return-requested' })
            .eq('id', bookingId);
        
        if (error) {
            alert(t('error') + ': ' + error.message);
        } else {
            fetchBookings();
        }
        setProcessing(null);
    };

    const StatusBadge = ({ status }) => {
        const statusMap = {
            confirmed: { text: t('statusActive'), color: 'green' },
            cancelled: { text: t('statusCancelled'), color: 'red' },
            'picked-up': { text: t('statusPickedUp'), color: 'blue' },
            'return-requested': { text: t('statusReturnRequested'), color: 'yellow' },
            returned: { text: t('statusReturned'), color: 'slate' },
        };
        const currentStatus = statusMap[status] || { text: status, color: 'slate' };
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-${currentStatus.color}-100 text-${currentStatus.color}-800 capitalize`}>
                {currentStatus.text}
            </span>
        );
    };

    return (
        <DashboardLayout title={t('dashboardTitle')} description={t('dashboardDesc')}>
            <div className="space-y-6">
                {loading ? <p>{t('loading')}</p> : bookings.length > 0 ? (
                    bookings.map(booking => {
                        const isPastBooking = new Date(booking.end_date) < new Date();
                        const hasReview = booking.reviews && booking.reviews.length > 0;
                        const isCancelled = booking.status === 'cancelled';

                        return (
                            <div key={booking.id} className={`bg-white p-6 rounded-lg shadow-md ${isCancelled ? 'opacity-60 bg-slate-50' : ''}`}>
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <img src={booking.vehicles.image_urls[0]} alt={booking.vehicles.model} className="w-full md:w-40 h-auto md:h-24 object-cover rounded-md"/>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-4">
                                            <h3 className="font-bold text-lg">{booking.vehicles.make} {booking.vehicles.model}</h3>
                                            <StatusBadge status={booking.status} />
                                        </div>
                                        <p className="text-sm text-slate-500">{booking.vehicles.agencies.agency_name}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                                            <span><strong>{t('pickup')}:</strong> {new Date(booking.start_date).toLocaleDateString()}</span>
                                            <span><strong>{t('return')}:</strong> {new Date(booking.end_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right w-full md:w-auto mt-4 md:mt-0">
                                        <p className={`font-bold text-lg ${isCancelled ? 'line-through' : ''}`}>{booking.total_price.toLocaleString()} DZD</p>
                                        {!isCancelled && (
                                            <>
                                                <button onClick={() => handleDownload(booking)} disabled={processing === booking.id} className="mt-2 text-sm text-indigo-600 hover:underline flex items-center justify-end disabled:text-slate-400">
                                                    <Download size={14} className="mr-1" />
                                                    {processing === booking.id ? t('processing') : t('downloadInvoice')}
                                                </button>
                                                {booking.status === 'picked-up' && (
                                                    <button onClick={() => handleReturnRequest(booking.id)} disabled={processing === booking.id} className="mt-2 text-sm text-green-600 hover:underline flex items-center justify-end disabled:text-slate-400">
                                                        <Undo size={14} className="mr-1" />
                                                        {processing === booking.id ? t('processing') : t('declareReturn')}
                                                    </button>
                                                )}
                                                {isPastBooking && !hasReview && booking.status === 'returned' && (
                                                    <button
                                                        onClick={() => setShowReviewForm(booking)}
                                                        className="mt-2 text-sm text-amber-600 hover:underline font-semibold"
                                                    >
                                                        {t('leaveAReview')}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                {isCancelled && booking.cancellation_reason && (
                                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
                                        <p className="flex items-center">
                                            <AlertTriangle size={16} className="mr-2"/>
                                            <strong>{t('cancelledByAgency')}</strong> {booking.cancellation_reason}
                                        </p>
                                    </div>
                                )}
                                {!isCancelled && (
                                    <div className="mt-4 pt-4 border-t">
                                        <BookingProgressBar status={booking.status} />
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <p>{t('noBookingsYet')}</p>
                )}
            </div>
            {showReviewForm && (
                <ReviewForm
                    booking={showReviewForm}
                    onClose={() => setShowReviewForm(null)}
                    onReviewSubmitted={fetchBookings}
                />
            )}
        </DashboardLayout>
    );
}