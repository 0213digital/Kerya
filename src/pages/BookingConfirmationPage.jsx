import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { PartyPopper, Download } from 'lucide-react';

export function BookingConfirmationPage({ generateInvoice }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) {
                navigate('/');
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from('bookings')
                .select('*, vehicles(*, agencies(*))')
                .eq('id', bookingId)
                .single();
            
            if (error || !data) {
                console.error("Could not fetch booking confirmation:", error);
                navigate('/');
            } else {
                setBooking(data);
            }
            setLoading(false);
        };

        fetchBookingDetails();
    }, [bookingId, navigate]);

    const handleDownload = async () => {
        if (!booking) return;
        setIsProcessing(true);
        await generateInvoice(booking, t);
        setIsProcessing(false);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div></div>;
    }

    if (!booking) {
        return (
            <div className="container mx-auto max-w-2xl py-16 px-4 text-center">
                <p>{t('bookingNotFound')}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl py-16 px-4 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <PartyPopper size={64} className="mx-auto text-green-500" />
                <h1 className="text-3xl font-bold mt-4">{t('bookingConfirmedTitle')}</h1>
                <p className="text-slate-500 mt-2 mb-8">{t('bookingConfirmedDesc')}</p>
                
                <div className="text-left border-t border-slate-200 pt-6 space-y-3">
                    <h3 className="text-lg font-semibold">{t('bookingSummary')}</h3>
                    <div className="flex justify-between"><span>{t('vehicleLabel')}</span><span className="font-medium">{booking.vehicles.make} {booking.vehicles.model}</span></div>
                    <div className="flex justify-between"><span>{t('pickup')}</span><span className="font-medium">{new Date(booking.start_date).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span>{t('return')}</span><span className="font-medium">{new Date(booking.end_date).toLocaleDateString()}</span></div>
                    <div className="flex justify-between font-bold"><span>{t('totalPrice')}</span><span>{booking.total_price.toLocaleString()} DZD</span></div>
                </div>

                <button onClick={handleDownload} disabled={isProcessing} className="mt-8 w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 flex items-center justify-center disabled:bg-green-400">
                    <Download size={20} className="mr-2" />
                    {isProcessing ? t('processing') : t('downloadInvoice')}
                </button>
                <button onClick={() => navigate('/dashboard/bookings')} className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700">
                    {t('backToMyBookings')}
                </button>
            </div>
        </div>
    );
}
