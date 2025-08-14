import React, { useState, useEffect, useRef } from 'react'; // Importer useRef
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
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

    // Créer des refs pour les inputs de date
    const pickupDateRef = useRef(null);
    const returnDateRef = useRef(null);

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
        setSelectedCity(''); // Reset city when wilaya changes
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

    // Fonction pour gérer le focus sur les champs de date
    const handleDateFocus = (e) => {
        e.currentTarget.type = 'date';
        // Certains navigateurs peuvent nécessiter un petit délai
        setTimeout(() => {
            try {
                e.currentTarget.showPicker();
            } catch (error) {
                // showPicker() n'est pas supporté sur tous les navigateurs (ex: Firefox),
                // mais le passage à type="date" suffit généralement.
                console.log("e.currentTarget.showPicker() is not supported on this browser.");
            }
        }, 50);
    };

    return (
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg w-full">
            <div className="flex flex-col md:flex-row items-center">
                {/* Location Input */}
                <div className="relative w-full p-4">
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700">{t('searchFormLocation')}</label>
                    <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select id="location" value={selectedWilaya} onChange={(e) => setSelectedWilaya(e.target.value)} className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent">
                            <option value="">{t('anyLocation')}</option>
                            {locations.wilayas.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* City Input */}
                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>
                <div className="relative w-full p-4">
                    <label htmlFor="city" className="block text-sm font-medium text-slate-700">{t('city')}</label>
                    <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select id="city" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedWilaya} className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent disabled:bg-slate-50 disabled:cursor-not-allowed">
                            <option value="">{t('all')}</option>
                            {filteredCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>


                {/* Divider */}
                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>

                {/* Pickup Date */}
                <div className="relative w-full p-4">
                    <label htmlFor="pickup-date" className="block text-sm font-medium text-slate-700">{t('pickupDate')}</label>
                    <div className="relative mt-1" onClick={() => pickupDateRef.current.focus()}>
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                        <input 
                            ref={pickupDateRef}
                            type="text" // Type initial est 'text'
                            id="pickup-date" 
                            min={today} 
                            value={pickupDate}
                            onFocus={handleDateFocus} // Gère le changement de type et l'ouverture du calendrier
                            onChange={e => setPickupDate(e.target.value)} 
                            placeholder={t('dateFormatPlaceholder')} // Nouveau placeholder
                            className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent" 
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full md:w-px h-px md:h-12 bg-slate-200"></div>

                {/* Return Date */}
                <div className="relative w-full p-4">
                    <label htmlFor="return-date" className="block text-sm font-medium text-slate-700">{t('returnDate')}</label>
                    <div className="relative mt-1" onClick={() => returnDateRef.current.focus()}>
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                        <input 
                            ref={returnDateRef}
                            type="text" // Type initial est 'text'
                            id="return-date" 
                            min={pickupDate || today} 
                            value={returnDate} 
                            onFocus={handleDateFocus} // Gère le changement de type et l'ouverture du calendrier
                            onChange={(e) => setReturnDate(e.target.value)} 
                            placeholder={t('dateFormatPlaceholder')} // Nouveau placeholder
                            className="w-full pl-10 pr-4 py-2 border-none rounded-md focus:ring-2 focus:ring-indigo-500 bg-transparent" 
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