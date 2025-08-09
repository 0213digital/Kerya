import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Download } from 'lucide-react';
import { ReviewForm } from '../../components/ReviewForm'; // Import the new component

export function UserBookingsPage({ generateInvoice }) {
    const { t } = useTranslation();
    const { session } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingInvoice, setProcessingInvoice] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(null); // State for the review modal

    const handleDownload = async (booking) => {
        setProcessingInvoice(booking.id);
        await generateInvoice(booking, t);
        setProcessingInvoice(null);
    };

    // Use useCallback to memoize the fetch function
    const fetchBookings = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        // We need to check which bookings already have a review
        const { data, error } = await supabase
            .from('bookings')
            .select('*, vehicles(*, agencies(*)), profiles(*), reviews(id)') // <-- Add reviews(id) to the query
            .eq('user_id', session.user.id)
            .order('start_date', { ascending: false });
        
        if (error) {
            console.error("Error fetching bookings:", error);
        } else {
            setBookings(data || []);
        }
        setLoading(false);
    }, [session]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    return (
        <DashboardLayout title={t('dashboardTitle')} description={t('dashboardDesc')}>
            <div className="space-y-6">
                {loading ? <p>{t('loading')}</p> : bookings.length > 0 ? (
                    bookings.map(booking => {
                        const isPastBooking = new Date(booking.end_date) < new Date();
                        const hasReview = booking.reviews && booking.reviews.length > 0;

                        return (
                            <div key={booking.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row items-start md:items-center gap-4">
                                <img src={booking.vehicles.image_urls[0]} alt={booking.vehicles.model} className="w-full md:w-40 h-auto md:h-24 object-cover rounded-md"/>
                                <div className="flex-grow">
                                    <h3 className="font-bold text-lg">{booking.vehicles.make} {booking.vehicles.model}</h3>
                                    <p className="text-sm text-slate-500">{booking.vehicles.agencies.agency_name}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                                        <span><strong>{t('pickup')}:</strong> {new Date(booking.start_date).toLocaleDateString()}</span>
                                        <span><strong>{t('return')}:</strong> {new Date(booking.end_date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="text-right w-full md:w-auto mt-4 md:mt-0">
                                    <p className="font-bold text-lg">{booking.total_price.toLocaleString()} DZD</p>
                                    <button onClick={() => handleDownload(booking)} disabled={processingInvoice === booking.id} className="mt-2 text-sm text-indigo-600 hover:underline flex items-center justify-end disabled:text-slate-400">
                                        <Download size={14} className="mr-1" />
                                        {processingInvoice === booking.id ? t('processing') : t('downloadInvoice')}
                                    </button>
                                    {isPastBooking && !hasReview && (
                                        <button 
                                            onClick={() => setShowReviewForm(booking)}
                                            className="mt-2 text-sm text-amber-600 hover:underline font-semibold"
                                        >
                                            Leave a Review
                                        </button>
                                    )}
                                </div>
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
                    onReviewSubmitted={fetchBookings} // Refetch bookings to update the button status
                />
            )}
        </DashboardLayout>
    );
}
