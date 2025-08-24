import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { CancellationModal, ConfirmationModal } from '../../components/modals';
import { BookingProgressBar } from '../../components/dashboard/BookingProgressBar';
import { Ban, Check, Undo, CheckCircle, XCircle } from 'lucide-react';

export function AgencyBookingsPage() {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, booking: null });
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
        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', bookingId);

        if (error) {
            alert(t('error') + ': ' + error.message);
        } else {
            setModalState({ type: null, booking: null });
            fetchBookings();
        }
        setProcessing(false);
    };

    const handleDeclineBooking = async (reason) => {
        if (!modalState.booking || !reason.trim()) return;
        setProcessing(true);
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled', cancellation_reason: reason })
            .eq('id', modalState.booking.id);
            
        if (error) {
            alert(t('error') + ': ' + error.message);
        } else {
            setModalState({ type: null, booking: null });
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
                                        {b.status === 'pending_approval' && (
                                            <>
                                                <button onClick={() => setModalState({ type: 'approve', booking: b })} className="text-green-600 hover:text-green-800 font-semibold flex items-center text-sm"><CheckCircle size={14} className="mr-1"/>{t('approveBooking')}</button>
                                                <button onClick={() => setModalState({ type: 'decline', booking: b })} className="text-red-600 hover:text-red-800 font-semibold flex items-center text-sm"><XCircle size={14} className="mr-1"/>{t('declineBooking')}</button>
                                            </>
                                        )}
                                        {b.status === 'confirmed' && today >= bookingStartDate && (
                                            <button onClick={() => setModalState({ type: 'pickup', booking: b })} className="text-blue-600 hover:text-blue-800 font-semibold flex items-center text-sm"><Check size={14} className="mr-1"/>{t('markAsPickedUp')}</button>
                                        )}
                                        {b.status === 'picked-up' && today >= bookingEndDate && (
                                             <button onClick={() => setModalState({ type: 'return', booking: b })} className="text-slate-600 hover:text-slate-800 font-semibold flex items-center text-sm"><Undo size={14} className="mr-1"/>{t('markAsReturned')}</button>
                                        )}
                                        {b.status === 'confirmed' && (
                                            <button onClick={() => setModalState({ type: 'cancel', booking: b })} className="text-red-600 hover:text-red-800 font-semibold flex items-center text-sm"><Ban size={14} className="mr-1"/>{t('cancel')}</button>
                                        )}
                                         {b.status === 'return-requested' && (
                                            <button onClick={() => setModalState({ type: 'return', booking: b })} className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 font-semibold flex items-center text-sm"><Check size={14} className="mr-1"/>{t('approveReturn')}</button>
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

            {/* MODALS */}
            {modalState.type === 'cancel' && (
                <CancellationModal
                    booking={modalState.booking}
                    onClose={() => setModalState({ type: null, booking: null })}
                    onConfirm={(reason) => handleStatusUpdate(modalState.booking.id, 'cancelled', reason)}
                    processing={processing}
                />
            )}
             {modalState.type === 'decline' && (
                <CancellationModal
                    title={t('declineBookingConfirmTitle')}
                    text={t('declineBookingConfirmText')}
                    reasonLabel={t('declineBookingReasonPrompt')}
                    confirmText={t('declineBooking')}
                    booking={modalState.booking}
                    onClose={() => setModalState({ type: null, booking: null })}
                    onConfirm={handleDeclineBooking}
                    processing={processing}
                />
            )}
            {modalState.type === 'approve' && (
                 <ConfirmationModal
                    title={t('approveBookingConfirmTitle')}
                    text={t('approveBookingConfirmText')}
                    confirmText={t('approveBooking')}
                    onConfirm={() => handleStatusUpdate(modalState.booking.id, 'confirmed')}
                    onCancel={() => setModalState({ type: null, booking: null })}
                />
            )}
             {modalState.type === 'pickup' && (
                 <ConfirmationModal
                    title={t('confirmPickupTitle')}
                    text={t('confirmPickupText')}
                    confirmText={t('markAsPickedUp')}
                    onConfirm={() => handleStatusUpdate(modalState.booking.id, 'picked-up')}
                    onCancel={() => setModalState({ type: null, booking: null })}
                />
            )}
            {modalState.type === 'return' && (
                 <ConfirmationModal
                    title={t('confirmReturnTitle')}
                    text={t('confirmReturnText')}
                    confirmText={t('markAsReturned')}
                    onConfirm={() => handleStatusUpdate(modalState.booking.id, 'returned')}
                    onCancel={() => setModalState({ type: null, booking: null })}
                />
            )}
        </DashboardLayout>
    );
}