import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { VehicleCard } from '../components/VehicleCard';
import { SlidersHorizontal, Car } from 'lucide-react';

/**
 * SearchPage Component
 * Displays search results based on URL query parameters.
 * It uses the `useLocation` hook to read filters from the URL.
 */
export function SearchPage() {
    // --- Hooks ---
    const { search } = useLocation(); // Gets the query string from the URL (e.g., "?location=Algiers&from=...")
    const { t } = useTranslation();

    // --- State ---
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [maxPrice, setMaxPrice] = useState(30000);
    const [transmission, setTransmission] = useState('all');
    const [fuelType, setFuelType] = useState('all');
    const [minSeats, setMinSeats] = useState(1);

    // --- Memoization ---
    // This ensures the search parameters are only parsed when the URL search string changes.
    const searchParams = useMemo(() => new URLSearchParams(search), [search]);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchVehicles = async () => {
            setLoading(true);
            setError(null);

            // Get search parameters from the parsed URL
            const from = searchParams.get('from');
            const to = searchParams.get('to');
            const location = searchParams.get('location');
            
            let availableVehicleIds = null;

            // 1. If dates are provided, find vehicles available during that range
            if (from && to) {
                const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_vehicles', {
                    start_date_in: from,
                    end_date_in: to
                });

                if (rpcError) {
                    console.error("Error calling RPC:", rpcError);
                    setError(rpcError.message);
                    setLoading(false);
                    return;
                }
                availableVehicleIds = rpcData.map(item => item.vehicle_id);
                // If the date range returns no available cars, we can stop here.
                if (availableVehicleIds.length === 0) {
                    setVehicles([]);
                    setLoading(false);
                    return;
                }
            }

            // 2. Build the main query
            let query = supabase
                .from('vehicles')
                .select(`*, agencies!inner(agency_name, city, wilaya)`)
                .eq('agencies.verification_status', 'verified');

            // 3. Apply filters
            if (location) {
                query = query.eq('agencies.wilaya', location);
            }
            if (availableVehicleIds) {
                query = query.in('id', availableVehicleIds);
            }

            // 4. Execute the query
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
    }, [searchParams]); // This effect re-runs whenever the URL search parameters change

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
            <h1 className="text-3xl font-bold mb-2 text-slate-800">{t('searchResults')}</h1>
            <p className="text-slate-500 mb-8">{t('showingResults', { count: filteredVehicles.length })}</p>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <aside className="w-full lg:w-1/4 xl:w-1/5">
                    <div className="p-6 bg-white rounded-lg shadow-md sticky top-28">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center"><SlidersHorizontal size={20} className="mr-2"/> {t('filters')}</h2>
                            <button onClick={resetFilters} className="text-sm text-indigo-600 hover:underline">{t('clearFilters')}</button>
                        </div>
                        <div className="space-y-6">
                             <div>
                                <label htmlFor="price" className="block text-sm font-medium text-slate-700">{t('priceRange')}</label>
                                <input type="range" id="price" min="1000" max="30000" step="1000" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2" />
                                <div className="text-center mt-1 text-sm text-slate-500">{t('maxPrice')}: {maxPrice.toLocaleString()} DZD</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('transmission')}</label>
                                <select value={transmission} onChange={e => setTransmission(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white">
                                    <option value="all">All</option>
                                    <option value="manual">{t('manual')}</option>
                                    <option value="automatic">{t('automatic')}</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700">{t('fuelType')}</label>
                                <select value={fuelType} onChange={e => setFuelType(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white">
                                    <option value="all">All</option>
                                    <option value="gasoline">{t('gasoline')}</option>
                                    <option value="diesel">{t('diesel')}</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="seats" className="block text-sm font-medium text-slate-700">{t('seats')}</label>
                                <input type="number" id="seats" min="1" max="9" value={minSeats} onChange={e => setMinSeats(Number(e.target.value))} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Results */}
                <main className="w-full lg:w-3/4 xl:w-4/5">
                    {loading ? (
                        <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div></div>
                    ) : error ? (
                        <div className="text-center bg-red-100 text-red-700 p-4 rounded-lg">{t('error')}: {error}</div>
                    ) : filteredVehicles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredVehicles.map(vehicle => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </div>
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
