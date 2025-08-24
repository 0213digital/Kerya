import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { Search, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Datepicker from "react-tailwindcss-datepicker";

export function SearchForm() {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const [locations, setLocations] = useState({ wilayas: [], cities: [] });
    const [selectedWilaya, setSelectedWilaya] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    
    const [dateValue, setDateValue] = useState({ 
        startDate: null, 
        endDate: null 
    }); 

    useEffect(() => {
        const fetchLocations = async () => {
            const { data: wilayasData } = await supabase.from('wilayas').select('id, name').order('name');
            const { data: citiesData } = await supabase.from('cities').select('id, name, wilaya_id').order('name');
            setLocations({ wilayas: wilayasData || [], cities: citiesData || [] });
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

    const handleDateValueChange = (newValue) => {
        setDateValue(newValue); 
    } 

    const handleSearch = (e) => {
        e.preventDefault();
        const searchParams = new URLSearchParams({
            location: selectedWilaya,
            city: selectedCity,
            from: dateValue.startDate || '',
            to: dateValue.endDate || ''
        }).toString();
        navigate(`/search?${searchParams}`);
    };

    return (
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg w-full p-2 md:p-0">
            <div className="flex flex-col md:flex-row items-center">
                {/* Location Input */}
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

                {/* City Input */}
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

                {/* Divider */}
                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>

                {/* Date Range Picker */}
                <div className="relative w-full p-2 md:p-4 md:w-2/5">
                     <label className="block text-sm font-medium text-slate-700">{t('pickupDate')} - {t('returnDate')}</label>
                     <Datepicker 
                        primaryColor={"indigo"} 
                        value={dateValue} 
                        onChange={handleDateValueChange} 
                        showShortcuts={true} 
                        placeholder={t('dateRangePickerPlaceholder')}
                        i18n={language}
                        minDate={new Date()} 
                        inputClassName="w-full mt-1 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent"
                    /> 
                </div>

                {/* Search Button */}
                <div className="p-2 w-full md:w-auto">
                    <button type="submit" className="w-full md:w-auto flex items-center justify-center p-3 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">
                        <Search size={24} />
                    </button>
                </div>
            </div>
        </form>
    );
}
