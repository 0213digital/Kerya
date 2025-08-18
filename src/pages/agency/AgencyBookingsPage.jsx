import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { CancellationModal, ConfirmationModal } from '../../components/modals';
import { BookingProgressBar } from '../../components/dashboard/BookingProgressBar';
import { Ban, Check, Undo } from 'lucide-react';

export function AgencyBookingsPage() {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(null);
    const [processing, setProcessing] = useState(false);

    const fetchBookings = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        const { data: agencyData } = await supabase.from('agencies').select('id').eq('owner_id', profile.id).single();
        if (!agencyData) { setLoading(false); return; }
        const { data: vehicleData } = await supabase.from('vehicles').select('id').eq('agency_id', agencyData.id);
        if (!vehicleData || vehicleData.length === 0) { setLoading(false); return; }
        const vehicleIds = vehicleData.map(v => v.id);
        const { data } = await supabase.from('bookings').select('*, vehicles(make, model), profiles(*)').in('vehicle_id', vehicleIds).order('start_date', { ascending: false });
        setBookings(data || []);
        setLoading(false);
    }, [profile]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleStatusUpdate = async (bookingId, newStatus) => {
        setProcessing(true);
        const { error } = await supabase.rpc('update_booking_status_by_agency', {
            p_booking_id: bookingId,
            p_new_status: newStatus,
        });
        if (error) {
            alert(t('error') + ': ' + error.message);
        } else {
            setShowConfirmModal(null);
            fetchBookings();
        }
        setProcessing(false);
    };

    const handleCancelBooking = async (reason) => {
        if (!showCancelModal || !reason.trim()) return;
        setProcessing(true);
        const { error } = await supabase.rpc('cancel_booking_by_agency', {
            p_booking_id: showCancelModal.id,
            p_reason: reason,
        });
        if (error) {
            alert(t('error') + ': ' + error.message);
        } else {
            setShowCancelModal(null);
            fetchBookings();
        }
        setProcessing(false);
    };

    const today = new Date().setHours(0, 0, 0, 0);

    return (
        <DashboardLayout title={t('agencyBookings')} description={t('agencyBookingsDesc')}>
            <div className="space-y-6">
            {loading ? <p>{t('loading')}</p> : bookings.length > 0 ? (
                bookings.map(b => {
                    const bookingStartDate = new Date(b.start_date).setHours(0, 0, 0, 0);
                    const bookingEndDate = new Date(b.end_date).setHours(0, 0, 0, 0);
                    return (
                        <div key={b.id} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex flex-col md:flex-row justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{b.vehicles.make} {b.vehicles.model}</p>
                                    <p className="text-sm text-slate-500">{t('bookedBy')} {b.profiles.full_name}</p>
                                    <p className="text-sm text-slate-500">{new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}</p>
                                </div>
                                <div className="mt-4 md:mt-0 md:text-right">
                                    <p className="font-bold text-lg">{b.total_price.toLocaleString()} DZD</p>
                                    <div className="flex justify-end items-center space-x-2 mt-2">
                                        {b.status === 'confirmed' && today >= bookingStartDate && (
                                            <button onClick={() => setShowConfirmModal({ booking: b, status: 'picked-up' })} className="text-blue-600 hover:text-blue-800 font-semibold flex items-center text-sm"><Check size={14} className="mr-1"/>{t('markAsPickedUp')}</button>
                                        )}
                                        {b.status === 'picked-up' && today >= bookingEndDate && (
                                             <button onClick={() => setShowConfirmModal({ booking: b, status: 'returned' })} className="text-slate-600 hover:text-slate-800 font-semibold flex items-center text-sm"><Undo size={14} className="mr-1"/>{t('markAsReturned')}</button>
                                        )}
                                        {b.status === 'confirmed' && (
                                            <button onClick={() => setShowCancelModal(b)} className="text-red-600 hover:text-red-800 font-semibold flex items-center text-sm"><Ban size={14} className="mr-1"/>{t('cancel')}</button>
                                        )}
                                         {b.status === 'return-requested' && (
                                            <button onClick={() => setShowConfirmModal({ booking: b, status: 'returned' })} className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 font-semibold flex items-center text-sm"><Check size={14} className="mr-1"/>{t('approveReturn')}</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <BookingProgressBar status={b.status} t={t} />
                            </div>
                        </div>
                    )
                })
            ) : <p>{t('noBookingsFoundForAgency')}</p>}
            </div>
            {showCancelModal && (
                <CancellationModal
                    booking={showCancelModal}
                    onClose={() => setShowCancelModal(null)}
                    onConfirm={handleCancelBooking}
                    processing={processing}
                />
            )}
            {showConfirmModal && (
                 <ConfirmationModal
                    title={showConfirmModal.status === 'picked-up' ? t('confirmPickupTitle') : t('confirmReturnTitle')}
                    text={showConfirmModal.status === 'picked-up' ? t('confirmPickupText') : t('confirmReturnText')}
                    confirmText={showConfirmModal.status === 'picked-up' ? t('markAsPickedUp') : t('markAsReturned')}
                    onConfirm={() => handleStatusUpdate(showConfirmModal.booking.id, showConfirmModal.status)}
                    onCancel={() => setShowConfirmModal(null)}
                />
            )}
        </DashboardLayout>
    );
}