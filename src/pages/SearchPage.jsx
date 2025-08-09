import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { VehicleCard } from '../components/VehicleCard';
import { InteractiveMap } from '../components/InteractiveMap';
import { SlidersHorizontal, Car, Map, List, Star } from 'lucide-react';
import { carData } from '../data/geoAndCarData'; // We need car data for make/model filters

export function SearchPage() {
    const { search } = useLocation();
    const { t } = useTranslation();

    // --- State ---
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('list');

    // --- Advanced Filter States ---
    const [maxPrice, setMaxPrice] = useState(30000);
    const [transmission, setTransmission] = useState('all');
    const [fuelType, setFuelType] = useState('all');
    const [minSeats, setMinSeats] = useState(2); // Default starts at 2
    const [makeFilter, setMakeFilter] = useState('all');
    const [modelFilter, setModelFilter] = useState('all');
    const [minYear, setMinYear] = useState(2010);
    const [maxYear, setMaxYear] = useState(new Date().getFullYear());
    const [minRating, setMinRating] = useState(0);
    const [sortBy, setSortBy] = useState('price_asc');
    const [availableModels, setAvailableModels] = useState([]);

    const searchParams = useMemo(() => new URLSearchParams(search), [search]);

    useEffect(() => {
        if (makeFilter !== 'all' && carData[makeFilter]) {
            setAvailableModels(carData[makeFilter]);
        } else {
            setAvailableModels([]);
        }
        setModelFilter('all'); // Reset model when make changes
    }, [makeFilter]);

    useEffect(() => {
        const fetchVehicles = async () => {
            setLoading(true);
            setError(null);

            const from = searchParams.get('from');
            const to = searchParams.get('to');
            const location = searchParams.get('location');
            
            let availableVehicleIds = null;

            if (from && to) {
                const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_vehicles', { start_date_in: from, end_date_in: to });
                if (rpcError) {
                    setError(rpcError.message);
                    setLoading(false);
                    return;
                }
                availableVehicleIds = rpcData.map(item => item.vehicle_id);
                if (availableVehicleIds.length === 0) {
                    setVehicles([]);
                    setLoading(false);
                    return;
                }
            }

            let query = supabase
                .from('vehicles')
                .select(`*, agencies!inner(agency_name, city, wilaya, latitude, longitude), reviews(rating)`)
                .eq('agencies.verification_status', 'verified');

            if (location) query = query.eq('agencies.wilaya', location);
            if (availableVehicleIds) query = query.in('id', availableVehicleIds);
            
            const { data, error: vehiclesError } = await query;
            if (vehiclesError) {
                setError(vehiclesError.message);
            } else {
                // Calculate average rating for each vehicle
                const vehiclesWithAvgRating = data.map(vehicle => {
                    const ratings = vehicle.reviews.map(r => r.rating);
                    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
                    return { ...vehicle, avg_rating: avgRating };
                });
                setVehicles(vehiclesWithAvgRating);
            }
            setLoading(false);
        };
        fetchVehicles();
    }, [searchParams]);

    const filteredAndSortedVehicles = useMemo(() => {
        const filtered = vehicles.filter(v => 
            v.daily_rate_dzd <= maxPrice &&
            (transmission === 'all' || v.transmission === transmission) &&
            (fuelType === 'all' || v.fuel_type === fuelType) &&
            v.seats >= minSeats &&
            (makeFilter === 'all' || v.make === makeFilter) &&
            (modelFilter === 'all' || v.model === modelFilter) &&
            v.year >= minYear && v.year <= maxYear &&
            v.avg_rating >= minRating
        );

        switch (sortBy) {
            case 'price_asc':
                return filtered.sort((a, b) => a.daily_rate_dzd - b.daily_rate_dzd);
            case 'price_desc':
                return filtered.sort((a, b) => b.daily_rate_dzd - a.daily_rate_dzd);
            case 'rating_desc':
                return filtered.sort((a, b) => b.avg_rating - a.avg_rating);
            default:
                return filtered;
        }
    }, [vehicles, maxPrice, transmission, fuelType, minSeats, makeFilter, modelFilter, minYear, maxYear, minRating, sortBy]);

    const resetFilters = () => {
        setMaxPrice(30000);
        setTransmission('all');
        setFuelType('all');
        setMinSeats(2); // Reset to 2
        setMakeFilter('all');
        setModelFilter('all');
        setMinYear(2010);
        setMaxYear(new Date().getFullYear());
        setMinRating(0);
        setSortBy('price_asc');
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">{t('searchResults')}</h1>
                    <p className="text-slate-500 mt-1">{t('showingResults', { count: filteredAndSortedVehicles.length })}</p>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                     <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-sm">
                        <option value="price_asc">{t('priceLowHigh')}</option>
                        <option value="price_desc">{t('priceHighLow')}</option>
                        <option value="rating_desc">{t('ratingHighLow')}</option>
                    </select>
                    <div className="flex items-center space-x-2 p-1 bg-slate-200 rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md flex items-center gap-2 text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><List size={16} /> {t('list')}</button>
                        <button onClick={() => setViewMode('map')} className={`px-3 py-1 rounded-md flex items-center gap-2 text-sm ${viewMode === 'map' ? 'bg-white shadow' : ''}`}><Map size={16} /> {t('map')}</button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 mt-6">
                <aside className="w-full lg:w-1/4 xl:w-1/5">
                    <div className="p-6 bg-white rounded-lg shadow-md sticky top-28 space-y-6">
                         <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center"><SlidersHorizontal size={20} className="mr-2"/> {t('filters')}</h2>
                            <button onClick={resetFilters} className="text-sm text-indigo-600 hover:underline">{t('clearFilters')}</button>
                        </div>
                        
                        {/* New Filters */}
                        <div><label className="block text-sm font-medium">{t('make')}</label><select value={makeFilter} onChange={e => setMakeFilter(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"><option value="all">{t('all')}</option>{Object.keys(carData).map(make => <option key={make} value={make}>{make}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">{t('model')}</label><select value={modelFilter} onChange={e => setModelFilter(e.target.value)} disabled={makeFilter === 'all'} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white disabled:bg-slate-100"><option value="all">{t('all')}</option>{availableModels.map(model => <option key={model} value={model}>{model}</option>)}</select></div>

                        {/* Existing Filters */}
                        <div><label className="block text-sm font-medium">{t('priceRange')}</label><input type="range" min="3000" max="30000" step="1000" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full mt-2" /><div className="text-sm text-right">{maxPrice.toLocaleString()} DZD</div></div>
                        <div><label className="block text-sm font-medium">{t('transmission')}</label><select value={transmission} onChange={e => setTransmission(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"><option value="all">{t('all')}</option><option value="manual">{t('manual')}</option><option value="automatic">{t('automatic')}</option></select></div>
                        <div><label className="block text-sm font-medium">{t('fuelType')}</label><select value={fuelType} onChange={e => setFuelType(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"><option value="all">{t('all')}</option><option value="gasoline">{t('gasoline')}</option><option value="diesel">{t('diesel')}</option></select></div>
                        
                        {/* Modified Seats Filter */}
                        <div><label className="block text-sm font-medium">{t('seats')}</label><select value={minSeats} onChange={e => setMinSeats(Number(e.target.value))} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white">{[2,3,4,5,6,7,8,9].map(s => <option key={s} value={s}>{s}+</option>)}</select></div>

                        {/* Year Range Filter */}
                        <div><label className="block text-sm font-medium">{t('yearRange')}</label><div className="flex items-center gap-2 mt-1"><input type="number" value={minYear} onChange={e => setMinYear(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-md" /><span className="text-slate-500">-</span><input type="number" value={maxYear} onChange={e => setMaxYear(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-md" /></div></div>

                        {/* Rating Filter */}
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('minRating')}</label>
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} onClick={() => setMinRating(star === minRating ? 0 : star)} className={`cursor-pointer ${minRating >= star ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="w-full lg:w-3/4 xl:w-4/5">
                    {loading ? (
                        <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div></div>
                    ) : error ? (
                        <div className="text-center bg-red-100 text-red-700 p-4 rounded-lg">{t('error')}: {error}</div>
                    ) : filteredAndSortedVehicles.length > 0 ? (
                        viewMode === 'list' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredAndSortedVehicles.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
                            </div>
                        ) : (
                            <div className="h-[70vh] rounded-lg shadow-md overflow-hidden">
                                <InteractiveMap vehicles={filteredAndSortedVehicles} />
                            </div>
                        )
                    ) : (
                        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                            <Car size={48} className="mx-auto text-slate-400" />
                            <h3 className="mt-4 text-xl font-semibold text-slate-800">{t('noVehiclesFound')}</h3>
                            <p className="mt-2 text-slate-500">{t('noVehiclesFoundDesc')}</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
