import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { Search, MapPin, Calendar } from 'lucide-react';

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
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg w-full">
            <div className="flex flex-col md:flex-row items-center">
                {/* Location Input */}
                <div className="relative w-full p-4">
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700">{t('searchFormLocation')}</label>
                    <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent">
                            <option value="">{t('anyLocation')}</option>
                            {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>

                {/* Pickup Date */}
                <div className="relative w-full p-4">
                    <label htmlFor="pickup-date" className="block text-sm font-medium text-slate-700">{t('pickupDate')}</label>
                    <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="date" id="pickup-date" min={today} value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent" />
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>

                {/* Return Date */}
                <div className="relative w-full p-4">
                    <label htmlFor="return-date" className="block text-sm font-medium text-slate-700">{t('returnDate')}</label>
                    <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="date" id="return-date" min={pickupDate || today} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent" />
                    </div>
                </div>

                {/* Search Button */}
                <div className="p-2 w-full md:w-auto">
                    <button type="submit" className="w-full md:w-auto flex items-center justify-center p-3 border border-transparent rounded-full text-white bg-indigo-600 hover:bg-indigo-700">
                        <Search size={24} />
                    </button>
                </div>
            </div>
        </form>
    );
}