import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { Users, Wind, Droplets, ChevronLeft, ChevronRight, MessageSquare, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { ReviewList } from '../components/ReviewList'; 

export function VehicleDetailsPage() {
    const { id: vehicleId } = useParams();
    const navigate = useNavigate();
    const { session, profile, isAgencyOwner } = useAuth();
    const { t } = useTranslation();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isContacting, setIsContacting] = useState(false);
    
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [contactError, setContactError] = useState('');

    const fetchVehicle = useCallback(async () => {
        if (!vehicleId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*, agencies(*)')
                .eq('id', vehicleId)
                .single();
            if (error) throw error;
            setVehicle(data);
        } catch (err) {
            console.error("Error fetching vehicle details:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [vehicleId]);

    useEffect(() => {
        fetchVehicle();
    }, [fetchVehicle]);

    const handleDateSelection = useCallback((start, end) => {
        if (start) {
            setStartDate(start.toISOString().split('T')[0]);
        } else {
            setStartDate(null);
        }
        
        if (end) {
            setEndDate(end.toISOString().split('T')[0]);
        } else {
            setEndDate(null);
        }
    }, []);


    const calculateDays = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) return 0;
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 1;
    };

    const rentalDays = calculateDays();
    const totalPrice = vehicle ? rentalDays * vehicle.daily_rate_dzd : 0;

    const handleBookingRequest = () => {
        if (!session) {
            navigate('/login');
            return;
        }
        if (isAgencyOwner) return;
        if (!startDate || !endDate) {
            alert(t('alertSelectDates'));
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            alert("La date de retour ne peut pas être antérieure à la date de départ.");
            return;
        }
        const searchParams = new URLSearchParams({ startDate, endDate }).toString();
        navigate(`/book/${vehicle.id}?${searchParams}`);
    };

    const handleContactAgency = async () => {
        if (!session) {
            navigate('/login');
            return;
        }
        if (isAgencyOwner) return;
        setIsContacting(true);
        setContactError('');
        const { data, error } = await supabase.rpc('get_or_create_conversation', {
            p_vehicle_id: vehicle.id,
            p_user_id: session.user.id
        });

        if (error) {
            console.error('Error starting conversation:', error);
            setContactError(t('error') + ': ' + error.message);
        } else {
            navigate('/dashboard/messages');
        }
        setIsContacting(false);
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div></div>;
    if (error) return <div className="container mx-auto p-4 text-center text-red-500">{t('error')}: {error}</div>;
    if (!vehicle) return <div className="container mx-auto p-4 text-center">{t('noVehiclesFound')}</div>;

    const transmissionText = vehicle.transmission === 'manual' ? t('manual') : t('automatic');
    const fuelText = vehicle.fuel_type === 'gasoline' ? t('gasoline') : t('diesel');
    const images = vehicle.image_urls && vehicle.image_urls.length > 0 ? vehicle.image_urls : [`https://placehold.co/800x600/e2e8f0/64748b?text=${vehicle.make}+${vehicle.model}`];
    
    const isOwner = profile && profile.id === vehicle.agencies.owner_id;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="relative mb-4">
                        <img src={images[activeImageIndex]} alt="Main vehicle view" className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg" />
                        {images.length > 1 && (
                            <>
                                <button onClick={() => setActiveImageIndex((activeImageIndex - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 rounded-full p-2"><ChevronLeft /></button>
                                <button onClick={() => setActiveImageIndex((activeImageIndex + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 rounded-full p-2"><ChevronRight /></button>
                            </>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex space-x-2 overflow-x-auto">
                            {images.map((img, index) => (
                                <img key={index} src={img} onClick={() => setActiveImageIndex(index)} alt={`Thumbnail ${index + 1}`} className={`w-24 h-24 object-cover rounded-md cursor-pointer ${index === activeImageIndex ? 'ring-2 ring-indigo-500' : ''}`} />
                            ))}
                        </div>
                    )}
                    <div className="mt-8">
                        <h1 className="text-3xl font-bold text-slate-800">{t('vehicleDetailsTitle', { make: vehicle.make, model: vehicle.model })}</h1>
                        <p className="text-lg text-slate-500">{vehicle.year}</p>
                        <div className="mt-6 flex flex-wrap gap-6 text-center">
                            <div className="flex flex-col items-center"><Users className="text-indigo-500" size={24} /><p className="mt-1 text-sm">{vehicle.seats} {t('seats')}</p></div>
                            <div className="flex flex-col items-center"><Wind className="text-indigo-500" size={24} /><p className="mt-1 text-sm capitalize">{transmissionText}</p></div>
                            <div className="flex flex-col items-center"><Droplets className="text-indigo-500" size={24} /><p className="mt-1 text-sm capitalize">{fuelText}</p></div>
                             {vehicle.security_deposit_dzd > 0 && (
                                <div className="flex flex-col items-center"><ShieldCheck className="text-indigo-500" size={24} /><p className="mt-1 text-sm">{t('securityDeposit')}</p></div>
                            )}
                        </div>
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold mb-2">{t('description')}</h2>
                            <p className="text-slate-600 whitespace-pre-wrap">{vehicle.description || t('noDescription')}</p>
                        </div>
                        <div className="mt-8 p-4 bg-slate-100 rounded-lg">
                            <h2 className="text-xl font-semibold mb-2">{t('agency')}</h2>
                            <p className="font-bold">{vehicle.agencies.agency_name}</p>
                            <p className="text-slate-600">{`${vehicle.agencies.city}, ${vehicle.agencies.wilaya}`}</p>
                        </div>
                    </div>
                    <div className="mt-12">
                        <ReviewList vehicleId={vehicle.id} />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-28 p-6 bg-white rounded-lg shadow-lg">
                        <p className="text-2xl font-bold mb-4">{vehicle.daily_rate_dzd.toLocaleString()} <span className="text-base font-normal text-slate-500">{t('dailyRateSuffix')}</span></p>
                        
                        {vehicle.security_deposit_dzd > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-sm">
                                <p><strong>{t('securityDeposit')}:</strong> {vehicle.security_deposit_dzd.toLocaleString()} DZD</p>
                            </div>
                        )}

                        <AvailabilityCalendar vehicleId={vehicle.id} onDateChange={handleDateSelection} />
                        
                        {totalPrice > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-200">
                                <div className="flex justify-between items-center text-lg">
                                    <span>{t('totalPrice')} ({rentalDays} {rentalDays > 1 ? t('days') : t('day')})</span>
                                    <span className="font-bold">{totalPrice.toLocaleString()} DZD</span>
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={handleBookingRequest} 
                            disabled={!startDate || !endDate || isAgencyOwner}
                            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            {session ? t('requestToBook') : t('loginToBook')}
                        </button>
                        
                        {!isOwner && (
                            <button
                                onClick={handleContactAgency}
                                disabled={isContacting || isAgencyOwner}
                                className="mt-4 w-full flex items-center justify-center bg-slate-600 text-white py-3 rounded-md font-semibold hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                <MessageSquare size={18} className="mr-2" />
                                {isContacting ? t('loading') : t('contactAgency')}
                            </button>
                        )}
                         {contactError && (
                            <div className="mt-4 text-red-600 text-sm flex items-center">
                                <AlertCircle size={16} className="mr-2" />
                                {contactError}
                            </div>
                        )}
                        {isAgencyOwner && !isOwner && (
                            <div className="mt-4 text-amber-800 bg-amber-100 p-3 rounded-md text-sm flex items-start">
                                <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                                <span>{t('agencyCannotRent')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}