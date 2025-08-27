import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { VehicleCard } from '../components/VehicleCard';
import { useTranslation } from '../contexts/LanguageContext';
import { SearchForm } from '../components/SearchForm';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function SearchPage() {
  const query = useQuery();
  const location = query.get('location');
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAvailableVehicles = async () => {
      if (!location || !startDate || !endDate) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('search_available_vehicles', {
        wilaya_param: location,
        start_date_param: startDate,
        end_date_param: endDate,
      });

      if (rpcError) {
        console.error('Error fetching available vehicles:', rpcError);
        setError(t('searchPage.errorFetching'));
        setVehicles([]);
      } else {
        setVehicles(data || []);
      }
      setLoading(false);
    };

    fetchAvailableVehicles();
  }, [location, startDate, endDate, t]);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{t('searchPage.title')}</h1>
      
      <div className="mb-8">
        <SearchForm />
      </div>

      {loading && <p className="text-center">{t('searchPage.loading')}</p>}
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
            <p className="text-center text-gray-600">{t('searchPage.noResults')}</p>
          )}
        </div>
      )}
    </div>
  );
}