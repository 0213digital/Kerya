import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { Search, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function SearchForm() {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    
    // Initialize state from sessionStorage or use default values
    const [formState, setFormState] = useState(() => {
        try {
            const savedState = sessionStorage.getItem('searchFormState');
            return savedState ? JSON.parse(savedState) : {
                selectedWilaya: '',
                selectedCity: '',
                pickupDate: '',
                returnDate: ''
            };
        } catch (error) {
            return {
                selectedWilaya: '',
                selectedCity: '',
                pickupDate: '',
                returnDate: ''
            };
        }
    });
    
    const [locations, setLocations] = useState({ wilayas: [], cities: [] });
    const [filteredCities, setFilteredCities] = useState([]);
    const today = new Date().toISOString().split('T')[0];

    const pickupDateRef = useRef(null);
    const returnDateRef = useRef(null);

    // Save state to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem('searchFormState', JSON.stringify(formState));
    }, [formState]);
    
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
                const fetchedLocations = {
                    wilayas: wilayasData || [],
                    cities: citiesData || []
                };
                setLocations(fetchedLocations);

                // Re-filter cities based on stored wilaya after locations are fetched
                if (formState.selectedWilaya) {
                    const wilayaObj = (wilayasData || []).find(w => w.name === formState.selectedWilaya);
                    if (wilayaObj) {
                        setFilteredCities((citiesData || []).filter(c => c.wilaya_id === wilayaObj.id));
                    }
                }
            }
        };
        fetchLocations();
    }, []); // Fetch locations only once

    // Effect to update filtered cities when selectedWilaya changes
    useEffect(() => {
        if (formState.selectedWilaya) {
            const wilayaObj = locations.wilayas.find(w => w.name === formState.selectedWilaya);
            if (wilayaObj) {
                setFilteredCities(locations.cities.filter(c => c.wilaya_id === wilayaObj.id));
            }
        } else {
            setFilteredCities([]);
        }
    }, [formState.selectedWilaya, locations]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => {
            const newState = { ...prevState, [name]: value };
            // If wilaya is changed, reset city
            if (name === 'selectedWilaya') {
                newState.selectedCity = '';
            }
            // If pickup date is cleared, clear return date
            if (name === 'pickupDate' && !value) {
                newState.returnDate = '';
            }
            // If pickup date changes, ensure return date is not before it
            if (name === 'pickupDate' && newState.returnDate && new Date(newState.returnDate) < new Date(value)) {
                newState.returnDate = value;
            }
            return newState;
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const searchParams = new URLSearchParams({
            location: formState.selectedWilaya,
            city: formState.selectedCity,
            from: formState.pickupDate,
            to: formState.returnDate
        }).toString();
        navigate(`/search?${searchParams}`);
    };

    return (
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg w-full">
            <div className="flex flex-col md:flex-row items-center">
                {/* Location Input */}
                <div className="relative w-full p-4">
                    <label className="block text-sm font-medium text-slate-700">{t('searchFormLocation')}</label>
                    <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select name="selectedWilaya" value={formState.selectedWilaya} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent">
                            <option value="">{t('anyLocation')}</option>
                            {locations.wilayas.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* City Input */}
                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>
                <div className="relative w-full p-4">
                    <label className="block text-sm font-medium text-slate-700">{t('city')}</label>
                    <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select name="selectedCity" value={formState.selectedCity} onChange={handleInputChange} disabled={!formState.selectedWilaya} className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent disabled:bg-slate-50 disabled:cursor-not-allowed">
                            <option value="">{t('all')}</option>
                            {filteredCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>

                {/* Pickup Date */}
                <div className="relative w-full p-4">
                    <label className="block text-sm font-medium text-slate-700">{t('pickupDate')}</label>
                    <div 
                        className="relative mt-1 cursor-pointer flex items-center w-full pl-10 pr-4 py-2 border-none rounded-md focus-within:ring-2 focus-within:ring-indigo-500"
                        onClick={() => pickupDateRef.current?.showPicker()}
                    >
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <span className={`font-medium ${formState.pickupDate ? 'text-slate-800' : 'text-gray-500'}`}>
                            {formState.pickupDate ? formatDate(formState.pickupDate, language) : t('pickupDate')}
                        </span>
                        <input 
                            ref={pickupDateRef}
                            type="date"
                            name="pickupDate"
                            min={today} 
                            value={formState.pickupDate}
                            onChange={handleInputChange} 
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>

                {/* Return Date */}
                <div className="relative w-full p-4">
                    <label className="block text-sm font-medium text-slate-700">{t('returnDate')}</label>
                     <div 
                        className="relative mt-1 cursor-pointer flex items-center w-full pl-10 pr-4 py-2 border-none rounded-md focus-within:ring-2 focus-within:ring-indigo-500"
                        onClick={() => returnDateRef.current?.showPicker()}
                    >
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <span className={`font-medium ${formState.returnDate ? 'text-slate-800' : 'text-gray-500'}`}>
                            {formState.returnDate ? formatDate(formState.returnDate, language) : t('returnDate')}
                        </span>
                        <input 
                            ref={returnDateRef}
                            type="date"
                            name="returnDate"
                            min={formState.pickupDate || today} 
                            value={formState.returnDate} 
                            onChange={handleInputChange} 
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={!formState.pickupDate}
                        />
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
