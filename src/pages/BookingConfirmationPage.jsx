import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { PartyPopper, Download } from 'lucide-react';

// This function needs to be passed through props or context if it's not defined here.
// For now, we assume it's passed via AppContext.
export function BookingConfirmationPage({ params, generateInvoice }) {
    const { navigate } = useContext(AppContext);
    const { t } = useTranslation();
    const { booking } = params;
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDownload = async () => {
        setIsProcessing(true);
        await generateInvoice(booking, t);
        setIsProcessing(false);
    };

    if (!booking) { // Handle case where user lands here directly
        useEffect(() => { navigate('home'); }, [navigate]);
        return null;
    }

    return (
        <div className="container mx-auto max-w-2xl py-16 px-4 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <PartyPopper size={64} className="mx-auto text-green-500" />
                <h1 className="text-3xl font-bold mt-4">{t('bookingConfirmedTitle')}</h1>
                <p className="text-slate-500 mt-2 mb-8">{t('bookingConfirmedDesc')}</p>
                
                <div className="text-left border-t border-slate-200 pt-6 space-y-3">
                    <h3 className="text-lg font-semibold">Booking Summary</h3>
                    <div className="flex justify-between"><span>Vehicle:</span><span className="font-medium">{booking.vehicles.make} {booking.vehicles.model}</span></div>
                    <div className="flex justify-between"><span>{t('pickup')}</span><span className="font-medium">{new Date(booking.start_date).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span>{t('return')}</span><span className="font-medium">{new Date(booking.end_date).toLocaleDateString()}</span></div>
                    <div className="flex justify-between font-bold"><span>{t('totalPrice')}</span><span>{booking.total_price.toLocaleString()} DZD</span></div>
                </div>

                <button onClick={handleDownload} disabled={isProcessing} className="mt-8 w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 flex items-center justify-center disabled:bg-green-400">
                    <Download size={20} className="mr-2" />
                    {isProcessing ? t('processing') : t('downloadInvoice')}
                </button>
                <button onClick={() => navigate('dashboard/bookings')} className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700">
                    {t('backToMyBookings')}
                </button>
            </div>
        </div>
    );
}
