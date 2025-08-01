import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { CreditCard, Banknote } from 'lucide-react';

export function BookingPage({ params }) {
    const { supabase, session, navigate } = useContext(AppContext);
    const { t } = useTranslation();
    const { vehicleId, startDate, endDate, totalPrice } = params;
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!session) {
            navigate('login');
            return;
        }
        const fetchVehicle = async () => {
            if (!supabase || !vehicleId) return;
            setLoading(true);
            const { data, error } = await supabase.from('vehicles').select('*, agencies(*)').eq('id', vehicleId).single();
            if (error) console.error("Error fetching vehicle for booking:", error);
            else setVehicle(data);
            setLoading(false);
        };
        fetchVehicle();
    }, [supabase, vehicleId, session, navigate]);

    const handleConfirmBooking = async () => {
        if (!session || !vehicle) return;
        setProcessing(true);
        setError('');

        // Final availability check to prevent race conditions
        const { data: availableVehicles, error: rpcError } = await supabase.rpc('get_available_vehicles', {
            start_date_in: startDate,
            end_date_in: endDate
        });

        if (rpcError || !availableVehicles.some(v => v.vehicle_id === vehicle.id)) {
            setError(t('vehicleUnavailable'));
            setProcessing(false);
            return;
        }

        const { data: newBooking, error: insertError } = await supabase.from('bookings').insert([{
            vehicle_id: vehicle.id,
            user_id: session.user.id,
            start_date: startDate,
            end_date: endDate,
            total_price: totalPrice,
            payment_method: paymentMethod,
            status: 'confirmed'
        }]).select('*, vehicles(*, agencies(*)), profiles(*)').single();

        if (insertError) {
            setError(t('error') + ': ' + insertError.message);
        } else {
            navigate('booking-confirmation', { booking: newBooking });
        }
        setProcessing(false);
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div></div>;
    if (!vehicle) return <div className="container mx-auto p-4 text-center">{t('noVehiclesFound')}</div>;

    return (
        <div className="container mx-auto max-w-2xl py-16 px-4">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center mb-2">{t('confirmBookingTitle')}</h1>
                <p className="text-center text-slate-500 mb-8">{t('fromAgency', { agencyName: vehicle.agencies.agency_name, city: vehicle.agencies.city })}</p>
                
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</div>}

                <div className="flex items-center space-x-4 mb-6">
                    <img src={vehicle.image_urls[0]} alt={vehicle.model} className="w-32 h-20 object-cover rounded-md"/>
                    <div>
                        <h2 className="text-xl font-bold">{vehicle.make} {vehicle.model}</h2>
                        <p className="text-slate-500">{vehicle.year}</p>
                    </div>
                </div>

                <div className="border-t border-b border-slate-200 py-4 my-4 space-y-3">
                    <div className="flex justify-between"><span>{t('pickup')}</span><span className="font-medium">{new Date(startDate).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span>{t('return')}</span><span className="font-medium">{new Date(endDate).toLocaleDateString()}</span></div>
                    <div className="flex justify-between text-lg font-bold"><span>{t('totalPrice')}</span><span>{totalPrice.toLocaleString()} DZD</span></div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">{t('choosePayment')}</h3>
                    <div className="space-y-3">
                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${paymentMethod === 'cash' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-300'}`}>
                            <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="hidden" />
                            <Banknote size={24} className="mr-4 text-green-500" />
                            <span>{t('payByCash')}</span>
                        </label>
                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${paymentMethod === 'card' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-300'}`}>
                            <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="hidden" />
                            <CreditCard size={24} className="mr-4 text-blue-500" />
                            <span>{t('payByCard')}</span>
                        </label>
                    </div>
                </div>

                <button onClick={handleConfirmBooking} disabled={processing} className="mt-8 w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">
                    {processing ? t('processing') : t('confirmAndPay')}
                </button>
            </div>
        </div>
    );
}
