import React from 'react';
import { useSearch } from '../contexts/SearchContext';
import VehicleCard from '../components/VehicleCard';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../data/translations';

const SearchPage = () => {
  const { searchResults, loading, searchCriteria } = useSearch();
  const { language } = useLanguage();
  const t = translations[language];

  if (loading) {
    return <div>{t.loading}...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t.searchResults}</h1>
      {searchCriteria && (
        <p className="mb-4">{t.showingResultsFor} <strong>{searchCriteria.pickupLocation}</strong></p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.length > 0 ? (
          searchResults.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))
        ) : (
          <p>{t.noResults}</p>
        )}
      </div>
    </div>
  );
};