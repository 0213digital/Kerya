import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { VehicleCard } from '../components/VehicleCard';
import { carData } from '../data/geoAndCarData';
import { SlidersHorizontal } from 'lucide-react';

// Initial state for filters, now includes sorting
const initialState = {
  isFilterVisible: false,
  priceRange: [0, 50000],
  selectedBrand: '',
  selectedModel: '',
  selectedYear: '',
  selectedTransmission: '',
  selectedFuelType: '',
  sortBy: 'price_asc', // Default sort
  showAllYears: false,
};

// Reducer to manage filter state updates
function filterReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_FILTERS':
      return { ...state, isFilterVisible: !state.isFilterVisible };
    case 'SET_PRICE_RANGE':
      return { ...state, priceRange: action.payload };
    case 'SET_BRAND':
      return { ...state, selectedBrand: action.payload, selectedModel: '' };
    case 'SET_MODEL':
      return { ...state, selectedModel: action.payload };
    case 'SET_YEAR':
      return { ...state, selectedYear: action.payload };
    case 'SET_TRANSMISSION':
      return { ...state, selectedTransmission: action.payload };
    case 'SET_FUEL_TYPE':
      return { ...state, selectedFuelType: action.payload };
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };
    case 'TOGGLE_SHOW_ALL_YEARS':
      return { ...state, showAllYears: !state.showAllYears };
    case 'RESET_FILTERS':
      return {
        ...initialState,
        isFilterVisible: state.isFilterVisible,
      };
    default:
      throw new Error();
  }
}

// Reusable component for filter options
const FilterOption = ({ label, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
      isSelected
        ? 'bg-indigo-600 text-white font-semibold'
        : 'text-slate-700 hover:bg-indigo-50'
    }`}
  >
    {label}
  </button>
);

// Reusable component for grouping filters
const FilterGroup = ({ title, children }) => (
  <div className="py-4 border-b border-slate-200">
    <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const SearchPage = () => {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterState, dispatch] = useReducer(filterReducer, initialState);

  const {
    isFilterVisible, priceRange, selectedBrand, selectedModel,
    selectedYear, selectedTransmission, selectedFuelType, sortBy,
    showAllYears,
  } = filterState;

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('vehicles').select(`*, agencies (agency_name, address, latitude, longitude)`);
      
      // Apply filters
      query = query.gte('daily_rate_dzd', priceRange[0]);
      query = query.lte('daily_rate_dzd', priceRange[1]);
      if (selectedBrand) query = query.eq('make', selectedBrand);
      if (selectedModel) query = query.eq('model', selectedModel);
      if (selectedYear) query = query.eq('year', selectedYear);
      if (selectedTransmission) query = query.eq('transmission', selectedTransmission);
      if (selectedFuelType) query = query.eq('fuel_type', selectedFuelType);

      // Apply sorting
      const [sortField, sortDirection] = sortBy.split('_');
      if (sortField === 'price') {
        query = query.order('daily_rate_dzd', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'rating') {
        // Placeholder for rating sort if you add it later
        // query = query.order('rating', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [priceRange, selectedBrand, selectedModel, selectedYear, selectedTransmission, selectedFuelType, sortBy]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const brands = [...new Set(Object.keys(carData))];
  const models = selectedBrand ? [...new Set(carData[selectedBrand])] : [];
  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);
  const displayedYears = showAllYears ? years : years.slice(0, 10);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      <aside className={`w-full lg:w-80 flex-shrink-0 p-6 bg-white border-r border-slate-200 ${isFilterVisible ? 'block' : 'hidden'} lg:block`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center"><SlidersHorizontal size={20} className="mr-2 text-slate-500" />{t('filters')}</h2>
          <button onClick={() => dispatch({ type: 'RESET_FILTERS' })} className="text-sm font-medium text-indigo-600 hover:underline">{t('clearFilters')}</button>
        </div>

        <FilterGroup title={t('sortBy')}>
            <FilterOption label={t('priceLowHigh')} isSelected={sortBy === 'price_asc'} onClick={() => dispatch({ type: 'SET_SORT_BY', payload: 'price_asc' })} />
            <FilterOption label={t('priceHighLow')} isSelected={sortBy === 'price_desc'} onClick={() => dispatch({ type: 'SET_SORT_BY', payload: 'price_desc' })} />
            {/* <FilterOption label={t('ratingHighLow')} isSelected={sortBy === 'rating_desc'} onClick={() => dispatch({ type: 'SET_SORT_BY', payload: 'rating_desc' })} /> */}
        </FilterGroup>

        <FilterGroup title={t('priceRange')}>
          <input
            type="range"
            min="0"
            max="50000"
            step="1000"
            value={priceRange[1]}
            onChange={(e) => dispatch({ type: 'SET_PRICE_RANGE', payload: [0, Number(e.target.value)] })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>0 {t('dailyRateSuffix')}</span>
            <span>{priceRange[1].toLocaleString()} {t('dailyRateSuffix')}</span>
          </div>
        </FilterGroup>

        <FilterGroup title={t('make')}>
          <select
            value={selectedBrand}
            onChange={(e) => dispatch({ type: 'SET_BRAND', payload: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t('all')}</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </FilterGroup>

        {selectedBrand && (
            <FilterGroup title={t('model')}>
                <select
                value={selectedModel}
                onChange={(e) => dispatch({ type: 'SET_MODEL', payload: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                <option value="">{t('all')}</option>
                {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                ))}
                </select>
            </FilterGroup>
        )}
        
        <FilterGroup title={t('transmission')}>
            <div className="flex gap-2">
                {['automatic', 'manual'].map(type => (
                     <button key={type} onClick={() => dispatch({ type: 'SET_TRANSMISSION', payload: type })} className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors border capitalize ${selectedTransmission === type ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                        {t(type)}
                    </button>
                ))}
            </div>
        </FilterGroup>

        <FilterGroup title={t('fuelType')}>
            <div className="grid grid-cols-2 gap-2">
                {['gasoline', 'diesel'].map(type => (
                    <button key={type} onClick={() => dispatch({ type: 'SET_FUEL_TYPE', payload: type })} className={`px-3 py-2 text-sm rounded-md transition-colors border capitalize ${selectedFuelType === type ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                        {t(type)}
                    </button>
                ))}
            </div>
        </FilterGroup>

      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <button onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })} className="lg:hidden mb-4 w-full flex items-center justify-center gap-2 bg-white p-3 rounded-md shadow-sm border border-slate-200">
          <SlidersHorizontal size={16} />{isFilterVisible ? t('hideFilters') : t('showFilters')}
        </button>

        {loading && <p>{t('loading')}</p>}
        {error && <p className="text-red-500">{t('error')}: {error}</p>}
        
        {!loading && !error && (
            <>
                <p className="mb-4 text-slate-600">{t('showingResults', { count: vehicles.length })}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {vehicles.map(vehicle => (<VehicleCard key={vehicle.id} vehicle={vehicle} />))}
                </div>
                {vehicles.length === 0 && (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold text-slate-700">{t('noVehiclesFound')}</h3>
                        <p className="text-slate-500 mt-2">{t('tryAdjustingFilters')}</p>
                    </div>
                )}
            </>
        )}
      </main>
    </div>
  );
};

export default SearchPage;

