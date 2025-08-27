import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { VehicleCard } from '../components/VehicleCard'; // Corrected import
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../data/translations';
import SearchForm from '../components/SearchForm';

// A custom hook to parse query parameters from the URL
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function SearchPage() {
  const query = useQuery();
  const location = query.get('location');
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { language } = useContext(LanguageContext);
  const t = translations[language];

  useEffect(() => {
    const fetchAvailableVehicles = async () => {
      if (!location || !startDate || !endDate) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Call the RPC function on Supabase
      const { data, error: rpcError } = await supabase.rpc('search_available_vehicles', {
        wilaya_param: location,
        start_date_param: startDate,
        end_date_param: endDate,
      });

      if (rpcError) {
        console.error('Error fetching available vehicles:', rpcError);
        setError(t.searchPage.errorFetching);
        setVehicles([]);
      } else {
        setVehicles(data || []);
      }
      setLoading(false);
    };

    fetchAvailableVehicles();
  }, [location, startDate, endDate, t.searchPage.errorFetching]);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{t.searchPage.title}</h1>
      
      {/* We can show the search form again for easy modification */}
      <div className="mb-8">
        <SearchForm />
      </div>

      {loading && <p className="text-center">{t.searchPage.loading}</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div>
          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">{t.searchPage.noResults}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchPage;