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
            setLoading(true);
            setError(null);
            setVehicles([]);

            const pickupLocation = searchParams.get('pickupLocation');
            const returnLocation = searchParams.get('returnLocation') || pickupLocation;
            const pickupDate = searchParams.get('pickupDate');
            const returnDate = searchParams.get('returnDate');
            const pickupTime = searchParams.get('pickupTime');
            const returnTime = searchParams.get('returnTime');

            if (!pickupLocation || !pickupDate || !returnDate || !pickupTime || !returnTime) {
                console.error("Search parameters are missing from URL.");
                setError(t.searchPage.missingCriteria);
                setLoading(false);
                return;
            }

            // --- START OF REVISED FIX ---
            // The previous fix using `.toISOString()` was still causing a 400 error.
            // This suggests the RPC function expects a simpler, timezone-naive timestamp string.
            // We will now format the date and time directly into a 'YYYY-MM-DD HH:MI:SS'
            // string, which is a standard format that PostgreSQL can parse without ambiguity
            // and avoids any client-side timezone logic from the JavaScript Date object.
            const pickupDateTime = `${pickupDate} ${pickupTime}:00`;
            const returnDateTime = `${returnDate} ${returnTime}:00`;

            const rpcParams = {
                pickup_location: pickupLocation,
                return_location: returnLocation,
                pickup_datetime: pickupDateTime,
                return_datetime: returnDateTime,
            };

            // Log the exact parameters being sent for easier debugging.
            console.log("Calling 'get_available_vehicles' with params:", rpcParams);
            // --- END OF REVISED FIX ---

            try {
                // IMPORTANT: Double-check that the parameter names in `rpcParams` above
                // (e.g., 'pickup_location') EXACTLY match the argument names in your
                // SQL function definition in the Supabase dashboard. A mismatch here
                // is another common cause for 400 errors.
                const { data, error: rpcError } = await supabase.rpc('get_available_vehicles', rpcParams);

                if (rpcError) {
                    console.error('Supabase RPC Error:', rpcError);
                    setError(`${t.searchPage.errorFetching}: ${rpcError.message}`);
                } else {
                    setVehicles(data || []);
                }
            } catch (e) {
                console.error('A critical error occurred while fetching vehicles:', e);
                setError(t.searchPage.unexpectedError);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, [location.search, language, t]);

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

                {loading && (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-500">{t.searchPage.loading}</p>
                    </div>
                )}

                {error && (
                    <div className="text-center text-red-700 bg-red-100 border border-red-400 rounded-lg p-6 max-w-md mx-auto">
                        <h3 className="font-bold text-lg mb-2">{t.searchPage.errorTitle}</h3>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && vehicles.length === 0 && (
                    <div className="text-center text-gray-600 bg-gray-100 border border-gray-300 rounded-lg p-6 max-w-md mx-auto">
                        <h3 className="font-bold text-lg mb-2">{t.searchPage.noVehiclesTitle}</h3>
                        <p>{t.searchPage.noVehicles}</p>
                    </div>
                )}

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
