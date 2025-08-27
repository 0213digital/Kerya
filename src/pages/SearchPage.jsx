import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import VehicleCard from '../components/VehicleCard';
import InteractiveMap from '../components/InteractiveMap';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Helper hook to easily get URL query parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const SearchPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const query = useQuery();

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);

      const location = query.get('location') || '';
      const startDate = query.get('startDate');
      const endDate = query.get('endDate');

      // Only search if all parameters are present
      if (!location || !startDate || !endDate) {
        setVehicles([]);
        setLoading(false);
        return;
      }

      try {
        // **FIX:** Instead of fetching and filtering in the browser,
        // we now call the database function `search_available_vehicles`
        // to do all the work on the server.
        const { data, error } = await supabase.rpc('search_available_vehicles', {
          location_query: location,
          start_date_query: startDate,
          end_date_query: endDate,
        });

        if (error) throw error;

        // The RPC function returns a "flat" list of vehicles.
        // We need to re-format it slightly to match the nested structure
        // that the VehicleCard component expects (vehicle.agencies.name).
        const formattedVehicles = data.map(v => ({
          ...v, // Keep all original vehicle fields
          agencies: { // Create the nested 'agencies' object
            name: v.agency_name,
            address: v.agency_address,
          },
        }));

        setVehicles(formattedVehicles);

      } catch (error) {
        setError(error.message);
        console.error("Error fetching available vehicles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [query]); // Re-run the effect whenever the URL query changes

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Search Results</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading && <p>Loading vehicles...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {!loading && !error && vehicles.length === 0 && (
              <p>No vehicles found for the selected criteria. Try different dates or locations.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicles.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1 h-64 lg:h-auto">
            <InteractiveMap vehicles={vehicles} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
