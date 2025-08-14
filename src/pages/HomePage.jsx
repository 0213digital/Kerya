import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { SearchForm } from '../components/SearchForm';
import { VehicleCard } from '../components/VehicleCard';
import { Search, FileText, Car } from 'lucide-react';

export function HomePage() {
    const { t } = useTranslation();
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        const fetchVehicles = async () => {
            const { data: verifiedAgencies } = await supabase.from('agencies').select('id').eq('verification_status', 'verified');
            if (!verifiedAgencies || verifiedAgencies.length === 0) return;
            const agencyIds = verifiedAgencies.map(a => a.id);
            const { data } = await supabase.from('vehicles').select(`*, agencies ( agency_name, city, wilaya )`).in('agency_id', agencyIds).eq('is_available', true).limit(4);
            setVehicles(data || []);
        };
        fetchVehicles();
    }, []);

    return (
        <div>
            <div className="relative h-[60vh] min-h-[400px] bg-cover bg-center" style={{ backgroundImage: "url('https://amupkaaxnypendorkkrz.supabase.co/storage/v1/object/public/webpics/trade_registers/603c677d-4617-44df-be77-030de2f94546/landscape.jpg')" }}>
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white">{t('heroTitle')}</h1>
                    <p className="mt-4 text-lg md:text-xl text-slate-200 max-w-2xl">{t('heroSubtitle')}</p>
                    <div className="mt-8 w-full max-w-4xl"><SearchForm /></div>
                </div>
            </div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold text-center text-slate-800">{t('featuredVehicles')}</h2>
                <div className="mt-8 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {vehicles.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
                </div>
            </div>
            <div className="bg-white py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-slate-800">{t('howItWorks')}</h2>
                    <div className="mt-12 grid md:grid-cols-3 gap-12 text-center">
                        <div className="flex flex-col items-center"><div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600"><Search size={32} /></div><h3 className="mt-5 text-xl font-semibold">{t('step1Title')}</h3><p className="mt-2 text-slate-500">{t('step1Desc')}</p></div>
                        <div className="flex flex-col items-center"><div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600"><FileText size={32} /></div><h3 className="mt-5 text-xl font-semibold">{t('step2Title')}</h3><p className="mt-2 text-slate-500">{t('step2Desc')}</p></div>
                        <div className="flex flex-col items-center"><div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600"><Car size={32} /></div><h3 className="mt-5 text-xl font-semibold">{t('step3Title')}</h3><p className="mt-2 text-slate-500">{t('step3Desc')}</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
}