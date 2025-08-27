import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../data/translations';
import { algeriaWilayas } from '../data/geoAndCarData';

export function SearchForm() {
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);
  const t = translations[language];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!location || !startDate || !endDate) {
      setError(t.searchForm.errorAllFields);
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError(t.searchForm.errorInvalidDate);
      return;
    }
    setError('');
    navigate(`/search?location=${location}&startDate=${startDate}&endDate=${endDate}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-1">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">{t.searchForm.location}</label>
          <select
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">{t.searchForm.selectLocation}</option>
            {algeriaWilayas.map((wilaya) => (
              <option key={wilaya} value={wilaya}>{wilaya}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">{t.searchForm.startDate}</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="md:col-span-1">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">{t.searchForm.endDate}</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="md:col-span-1">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t.searchForm.search}
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}