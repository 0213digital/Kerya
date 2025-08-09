import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { VehicleCard } from '../components/VehicleCard';
import { InteractiveMap } from '../components/InteractiveMap'; // Import the new map component
import { SlidersHorizontal, Car, Map, List } from 'lucide-react';

/**
 * SearchPage Component
 * Displays search results with both a list view and an interactive map view.
 */
export function SearchPage() {
    // --- Hooks ---
    const { search } = useLocation();
    const { t } = useTranslation();

    // --- State ---
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    // Client-side filter states
    const [maxPrice, setMaxPrice] = useState(30000);
    const [transmission, setTransmission] = useState('all');
    const [fuelType, setFuelType] = useState('all');
    const [minSeats, setMinSeats] = useState(1);

    // --- Memoization ---
    const searchParams = useMemo(() => new URLSearchParams(search), [search]);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchVehicles = async () => {
            setLoading(true);
            setError(null);

            const from = searchParams.get('from');
            const to = searchParams.get('to');
            const location = searchParams.get('location');
            
            let availableVehicleIds = null;

            // 1. Find available vehicles if dates are provided
            if (from && to) {
                const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_vehicles', { start_date_in: from, end_date_in: to });
                if (rpcError) {
                    console.error("Error calling RPC:", rpcError);
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

            // 2. Build the main query, ensuring agency coordinates are selected
            let query = supabase
                .from('vehicles')
                .select(`*, agencies!inner(agency_name, city, wilaya, latitude, longitude)`)
                .eq('agencies.verification_status', 'verified');

            // 3. Apply server-side filters
            if (location) query = query.eq('agencies.wilaya', location);
            if (availableVehicleIds) query = query.in('id', availableVehicleIds);
            
            // 4. Execute query
            const { data, error: vehiclesError } = await query;
            if (vehiclesError) {
                console.error("Error fetching vehicles:", vehiclesError);
                setError(vehiclesError.message);
            } else {
                setVehicles(data || []);
            }
            setLoading(false);
        };
        fetchVehicles();
    }, [searchParams]);

    // --- Client-side Filtering ---
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v => 
            v.daily_rate_dzd <= maxPrice &&
            (transmission === 'all' || v.transmission === transmission) &&
            (fuelType === 'all' || v.fuel_type === fuelType) &&
            v.seats >= minSeats
        );
    }, [vehicles, maxPrice, transmission, fuelType, minSeats]);

    const resetFilters = () => {
        setMaxPrice(30000);
        setTransmission('all');
        setFuelType('all');
        setMinSeats(1);
    };

    // --- Render Logic ---
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">{t('searchResults')}</h1>
                    <p className="text-slate-500 mt-1">{t('showingResults', { count: filteredVehicles.length })}</p>
                </div>
                {/* View mode toggle */}
                <div className="flex items-center space-x-2 p-1 bg-slate-200 rounded-lg mt-4 sm:mt-0">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><List size={18} /> {t('list')}</button>
                    <button onClick={() => setViewMode('map')} className={`px-3 py-1 rounded-md flex items-center gap-2 ${viewMode === 'map' ? 'bg-white shadow' : ''}`}><Map size={18} /> {t('map')}</button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 mt-6">
                {/* Filters Sidebar */}
                <aside className="w-full lg:w-1/4 xl:w-1/5">
                    <div className="p-6 bg-white rounded-lg shadow-md sticky top-28">
                         <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center"><SlidersHorizontal size={20} className="mr-2"/> {t('filters')}</h2>
                            <button onClick={resetFilters} className="text-sm text-indigo-600 hover:underline">{t('clearFilters')}</button>
                        </div>
                        {/* ... (rest of your filter inputs are unchanged) ... */}
                    </div>
                </aside>

                {/* Results Area */}
                <main className="w-full lg:w-3/4 xl:w-4/5">
                    {loading ? (
                        <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div></div>
                    ) : error ? (
                        <div className="text-center bg-red-100 text-red-700 p-4 rounded-lg">{t('error')}: {error}</div>
                    ) : filteredVehicles.length > 0 ? (
                        viewMode === 'list' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredVehicles.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
                            </div>
                        ) : (
                            <div className="h-[70vh] rounded-lg shadow-md overflow-hidden">
                                <InteractiveMap vehicles={filteredVehicles} />
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
