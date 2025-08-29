import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function SearchForm() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [locations, setLocations] = useState({ wilayas: [], cities: [] });
    const [selectedWilaya, setSelectedWilaya] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const today = new Date().toISOString().split('T')[0];

    const pickupDateRef = useRef(null);
    const returnDateRef = useRef(null);

    const formatDate = (dateString, locale) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        return new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(adjustedDate);
    };

    useEffect(() => {
        const fetchLocations = async () => {
            const { data: wilayasData, error: wilayasError } = await supabase.from('wilayas').select('id, name').order('name');
            const { data: citiesData, error: citiesError } = await supabase.from('cities').select('id, name, wilaya_id').order('name');

            if (!wilayasError && !citiesError) {
                setLocations({
                    wilayas: wilayasData || [],
                    cities: citiesData || []
                });
            }
        };
        fetchLocations();
    }, []);

    useEffect(() => {
        if (selectedWilaya) {
            const wilayaObj = locations.wilayas.find(w => w.name === selectedWilaya);
            if (wilayaObj) {
                setFilteredCities(locations.cities.filter(c => c.wilaya_id === wilayaObj.id));
            }
        } else {
            setFilteredCities([]);
        }
        setSelectedCity('');
    }, [selectedWilaya, locations]);

    const handleSearch = (e) => {
        e.preventDefault();
        const searchParams = new URLSearchParams({
            location: selectedWilaya,
            city: selectedCity,
            from: pickupDate,
            to: returnDate
        }).toString();
        navigate(`/search?${searchParams}`);
    };

    return (
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg w-full p-2 md:p-0">
            <div className="flex flex-col md:flex-row items-center">
                <div className="relative w-full p-2 md:p-4">
                    <label className="block text-sm font-medium text-slate-700">{t('searchFormLocation')}</label>
                    <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select value={selectedWilaya} onChange={(e) => setSelectedWilaya(e.target.value)} className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent">
                            <option value="">{t('anyLocation')}</option>
                            {locations.wilayas.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>
                <div className="relative w-full p-2 md:p-4">
                    <label className="block text-sm font-medium text-slate-700">{t('city')}</label>
                    <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedWilaya} className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent disabled:bg-slate-50 disabled:cursor-not-allowed">
                            <option value="">{t('all')}</option>
                            {filteredCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>

                <div className="relative w-full p-2 md:p-4">
                    <label className="block text-sm font-medium text-slate-700">{t('pickupDate')}</label>
                    <div
                        className="relative mt-1 cursor-pointer flex items-center w-full pl-10 pr-4 py-2 border-none rounded-md focus-within:ring-2 focus-within:ring-indigo-500"
                        onClick={() => pickupDateRef.current?.showPicker()}
                    >
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <span className={`font-medium ${pickupDate ? 'text-slate-800' : 'text-gray-500'}`}>
                            {pickupDate ? formatDate(pickupDate, t('locale')) : t('pickupDate')}
                        </span>
                        <input
                            ref={pickupDateRef}
                            type="date"
                            min={today}
                            value={pickupDate}
                            onChange={e => setPickupDate(e.target.value)}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>

                <div className="relative w-full p-2 md:p-4">
                    <label className="block text-sm font-medium text-slate-700">{t('returnDate')}</label>
                     <div
                        className="relative mt-1 cursor-pointer flex items-center w-full pl-10 pr-4 py-2 border-none rounded-md focus-within:ring-2 focus-within:ring-indigo-500"
                        onClick={() => returnDateRef.current?.showPicker()}
                    >
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <span className={`font-medium ${returnDate ? 'text-slate-800' : 'text-gray-500'}`}>
                            {returnDate ? formatDate(returnDate, t('locale')) : t('returnDate')}
                        </span>
                        <input
                            ref={returnDateRef}
                            type="date"
                            min={pickupDate || today}
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={!pickupDate}
                        />
                    </div>
                </div>

                <div className="p-2 w-full md:w-auto">
                    <button type="submit" className="w-full md:w-auto flex items-center justify-center p-3 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">
                        <Search size={24} />
                    </button>
                </div>
            </div>
        </form>
    );
}