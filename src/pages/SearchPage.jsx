import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import VehicleCard from '../components/VehicleCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../contexts/LanguageContext';
import translations from '../data/translations';

const SearchPage = () => {
    const location = useLocation();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { language } = useLanguage();
    const t = translations[language];

    const searchParams = new URLSearchParams(location.search);
    const pickupLocationParam = searchParams.get('pickupLocation');

    useEffect(() => {
        const fetchVehicles = async () => {
            // Reset state for each new search
            setLoading(true);
            setError(null);
            setVehicles([]);

            const pickupLocation = searchParams.get('pickupLocation');
            // Default return location to pickup location if it's not specified
            const returnLocation = searchParams.get('returnLocation') || pickupLocation;
            const pickupDate = searchParams.get('pickupDate');
            const returnDate = searchParams.get('returnDate');
            const pickupTime = searchParams.get('pickupTime');
            const returnTime = searchParams.get('returnTime');

            // 1. Validate that all required parameters are present from the URL.
            if (!pickupLocation || !pickupDate || !returnDate || !pickupTime || !returnTime) {
                console.error("Search parameters are missing from URL.");
                setError(t.searchPage.missingCriteria);
                setLoading(false);
                return;
            }

            // --- START OF FIX ---
            // The 400 Bad Request error was caused by sending a poorly formatted timestamp.
            // The original code (`${pickupDate}T${pickupTime}:00`) creates a local time string
            // without a timezone, which can be ambiguous and is often rejected by the database.
            //
            // The correct approach is to create a proper Date object and then convert it
            // to a full ISO 8601 string in UTC using `.toISOString()`. This format is
            // unambiguous (e.g., "2023-10-27T10:00:00.000Z") and is the standard for APIs.
            let pickupDateTime;
            let returnDateTime;

            try {
                pickupDateTime = new Date(`${pickupDate}T${pickupTime}`).toISOString();
                returnDateTime = new Date(`${returnDate}T${returnTime}`).toISOString();
            } catch (e) {
                console.error("Invalid date/time format provided:", e);
                setError(t.searchPage.invalidDateTime);
                setLoading(false);
                return;
            }
            // --- END OF FIX ---

            try {
                // Call the RPC function with the correctly formatted, unambiguous timestamps.
                // The parameter names here (`pickup_location`, etc.) must exactly match the
                // argument names defined in your `get_available_vehicles` SQL function.
                const { data, error: rpcError } = await supabase.rpc('get_available_vehicles', {
                    pickup_location: pickupLocation,
                    return_location: returnLocation,
                    pickup_datetime: pickupDateTime,
                    return_datetime: returnDateTime,
                });

                if (rpcError) {
                    console.error('Supabase RPC Error:', rpcError);
                    setError(`${t.searchPage.errorFetching}: ${rpcError.message}`);
                } else {
                    setVehicles(data || []); // Ensure vehicles is an array even if data is null
                }
            } catch (e) {
                console.error('A critical error occurred while fetching vehicles:', e);
                setError(t.searchPage.unexpectedError);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, [location.search, language, t]); // Rerun the effect if the search URL or language changes

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {t.searchPage.resultsTitle}
                </h1>
                <p className="text-gray-600 mb-6">
                    {t.searchPage.resultsSubtitle.replace('{location}', pickupLocationParam || 'your selected location')}
                </p>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-500">{t.searchPage.loading}</p>
                        {/* Consider adding a visual spinner component here */}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center text-red-700 bg-red-100 border border-red-400 rounded-lg p-6 max-w-md mx-auto">
                        <h3 className="font-bold text-lg mb-2">{t.searchPage.errorTitle}</h3>
                        <p>{error}</p>
                    </div>
                )}

                {/* No Results State */}
                {!loading && !error && vehicles.length === 0 && (
                    <div className="text-center text-gray-600 bg-gray-100 border border-gray-300 rounded-lg p-6 max-w-md mx-auto">
                        <h3 className="font-bold text-lg mb-2">{t.searchPage.noVehiclesTitle}</h3>
                        <p>{t.searchPage.noVehicles}</p>
                    </div>
                )}

                {/* Success State with Results */}
                {!loading && !error && vehicles.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {vehicles.map((vehicle) => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default SearchPage;
