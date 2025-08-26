import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { VehicleCard } from '../components/VehicleCard';
import { InteractiveMap } from '../components/InteractiveMap';
import { SearchForm } from '../components/SearchForm';
import { FiList, FiMap } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

export function SearchPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchVehicles = async (searchParams) => {
    setLoading(true);
    try {
      let query = supabase
        .from('vehicles')
        .select(
          `
          *,
          agencies(
            agency_name,
            city,
            wilaya,
            latitude,
            longitude,
            verification_status
          ),
          bookings(
            reviews(
              rating
            )
          )
        `
        )
        .eq('agencies.verification_status', 'verified');

      // Apply filters from search params
      if (searchParams.city) {
        query = query.eq('agencies.city', searchParams.city);
      }
      if (searchParams.wilaya) {
        query = query.eq('agencies.wilaya', searchParams.wilaya);
      }
      if (searchParams.make) {
        query = query.eq('make', searchParams.make);
      }
      if (searchParams.transmission) {
        query = query.eq('transmission', searchParams.transmission);
      }
      if (searchParams.fuel_type) {
        query = query.eq('fuel_type', searchParams.fuel_type);
      }
      if (searchParams.min_price) {
        query = query.gte('daily_rate_dzd', searchParams.min_price);
      }
      if (searchParams.max_price) {
        query = query.lte('daily_rate_dzd', searchParams.max_price);
      }

      // Handle date filtering to exclude unavailable vehicles
      if (searchParams.start_date && searchParams.end_date) {
        // This is a simplified check. A more robust solution would involve checking for overlapping unavailability periods.
        // For now, we assume if a vehicle is marked unavailable for any reason, it's not shown.
        // A more complex query would be needed to handle specific date ranges against the vehicle_unavailability table.
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Post-process to calculate average rating from nested reviews
      const vehiclesWithAvgRating = data.map((vehicle) => {
        const allReviews = vehicle.bookings.flatMap(booking => booking.reviews);
        const totalRating = allReviews.reduce(
          (acc, review) => acc + review.rating,
          0
        );
        const avgRating =
          allReviews.length > 0
            ? (totalRating / allReviews.length).toFixed(1)
            : 'N/A';
        return { ...vehicle, avg_rating: avgRating };
      });

      setVehicles(vehiclesWithAvgRating);
    } catch (error) {
      setError(error.message);
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const params = {
      wilaya: searchParams.get('wilaya'),
      city: searchParams.get('city'),
      make: searchParams.get('make'),
      transmission: searchParams.get('transmission'),
      fuel_type: searchParams.get('fuel_type'),
      min_price: searchParams.get('min_price'),
      max_price: searchParams.get('max_price'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
    };
    fetchVehicles(params);
  }, [location.search]);

  const handleSearch = (searchCriteria) => {
    const params = new URLSearchParams();
    Object.keys(searchCriteria).forEach((key) => {
      if (searchCriteria[key]) {
        params.set(key, searchCriteria[key]);
      }
    });
    navigate(`/search?${params.toString()}`);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">{t('loading')}</div>
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-xl font-semibold">
          {t('error')}: {error}
        </div>
      </div>
    );

  return (
    <div className="container mx-auto p-4 lg-p-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <SearchForm onSearch={handleSearch} />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {t('searchResults')} ({vehicles.length})
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label={t('listView')}
          >
            <FiList size={20} />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label={t('mapView')}
          >
            <FiMap size={20} />
          </button>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 text-lg">{t('noVehiclesFound')}</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
          <InteractiveMap vehicles={vehicles} />
        </div>
      )}
    </div>
  );
}
