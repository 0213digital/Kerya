import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Download, AlertTriangle, Undo } from 'lucide-react';
import { ReviewForm } from '../../components/ReviewForm';
import { BookingProgressBar } from '../../components/dashboard/BookingProgressBar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fonction de fetch des réservations
const fetchUserBookings = async (userId) => {
    if (!userId) return [];
    const { data, error } = await supabase
        .from('bookings')
        .select('*, vehicles(*, agencies(*)), profiles(*), reviews(id)')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
};

// Fonction de mutation pour la demande de retour
const requestReturn = async (bookingId) => {
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'return-requested' })
        .eq('id', bookingId);
    if (error) throw new Error(error.message);
};


export function UserBookingsPage({ generateInvoice }) {
    const { t } = useTranslation();
    const { session } = useAuth();
    const queryClient = useQueryClient();

    const [processingInvoice, setProcessingInvoice] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(null);

    // useQuery pour récupérer les réservations
    const { data: bookings = [], isLoading, isError } = useQuery({
        queryKey: ['userBookings', session?.user?.id],
        queryFn: () => fetchUserBookings(session.user.id),
        enabled: !!session?.user?.id
    });

    // useMutation pour la demande de retour
    const returnMutation = useMutation({
        mutationFn: requestReturn,
        onSuccess: () => {
            // Invalide et refait la requête des réservations pour voir la mise à jour
            queryClient.invalidateQueries(['userBookings', session?.user?.id]);
        },
        onError: (error) => {
            alert(t('error') + ': ' + error.message);
        }
    });

    const handleDownload = async (booking) => {
        setProcessingInvoice(booking.id);
        await generateInvoice(booking, t);
        setProcessingInvoice(null);
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
                {isLoading ? <p>{t('loading')}</p> : isError ? <p>{t('error')}</p> : bookings.length > 0 ? (
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
                                                <button onClick={() => handleDownload(booking)} disabled={processingInvoice === booking.id} className="mt-2 text-sm text-indigo-600 hover:underline flex items-center justify-end disabled:text-slate-400">
                                                    <Download size={14} className="mr-1" />
                                                    {processingInvoice === booking.id ? t('processing') : t('downloadInvoice')}
                                                </button>
                                                {booking.status === 'picked-up' && (
                                                    <button onClick={() => returnMutation.mutate(booking.id)} disabled={returnMutation.isPending} className="mt-2 text-sm text-green-600 hover:underline flex items-center justify-end disabled:text-slate-400">
                                                        <Undo size={14} className="mr-1" />
                                                        {returnMutation.isPending ? t('processing') : t('declareReturn')}
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
                    onReviewSubmitted={() => queryClient.invalidateQueries(['userBookings', session?.user?.id])}
                />
            )}
        </DashboardLayout>
    );
}