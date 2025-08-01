import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { Search, MapPin, Calendar } from 'lucide-react';
// The problematic import of 'history' has been removed.

export function SearchForm({ wilayas }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [location, setLocation] = useState('');
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const today = new Date().toISOString().split('T')[0];

    const handleSearch = (e) => {
        e.preventDefault();
        const searchParams = new URLSearchParams({
            location,
            from: pickupDate,
            to: returnDate
        }).toString();
        navigate(`/search?${searchParams}`);
    };

    return (
        <form onSubmit={handleSearch} className="p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
                <label htmlFor="location" className="block text-sm font-medium text-slate-700">{t('searchFormLocation')}</label>
                <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                        <option value="">{t('anyLocation')}</option>
                        {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
            </div>
            <div className="md:col-span-1">
                <label htmlFor="pickup-date" className="block text-sm font-medium text-slate-700">{t('pickupDate')}</label>
                <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type="date" id="pickup-date" min={today} value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white" />
                </div>
            </div>
            <div className="md:col-span-1">
                <label htmlFor="return-date" className="block text-sm font-medium text-slate-700">{t('returnDate')}</label>
                <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type="date" id="return-date" min={pickupDate || today} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white" />
                </div>
            </div>
            <div className="md:col-span-1">
                <button type="submit" className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    <Search size={20} className="mr-2" /> {t('searchButton')}
                </button>
            </div>
        </form>
    );
}