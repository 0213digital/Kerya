import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../data/translations';
import { wilayas } from '../data/geoAndCarData';

const SearchForm = () => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const { performSearch } = useSearch();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performSearch({ pickupLocation, pickupDate, returnDate });
    navigate('/search');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">{t.pickupLocation}</option>
          {wilayas.map(w => <option key={w.code} value={w.name}>{w.name}</option>)}
        </select>
        <input
          type="date"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <button type="submit" className="mt-4 w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600">
        {t.search}
      </button>
    </form>
  );
};