import React, { useReducer, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import VehicleCard from '../components/VehicleCard';
import InteractiveMap from '../components/InteractiveMap';
import { carData } from '../data/geoAndCarData';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../data/translations';

// État initial pour les filtres
const initialState = {
  isFilterVisible: false,
  priceRange: [0, 50000],
  selectedBrand: '',
  selectedModel: '',
  selectedYear: '',
  selectedTransmission: '',
  selectedFuelType: '',
  showAllBrands: false,
  showAllModels: false,
  showAllYears: false,
};

// Le reducer qui gère les actions de mise à jour de l'état des filtres
function filterReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_FILTERS':
      return { ...state, isFilterVisible: !state.isFilterVisible };
    case 'SET_PRICE_RANGE':
      return { ...state, priceRange: action.payload };
    case 'SET_BRAND':
      return { ...state, selectedBrand: action.payload, selectedModel: '' }; // Réinitialise le modèle si la marque change
    case 'SET_MODEL':
      return { ...state, selectedModel: action.payload };
    case 'SET_YEAR':
      return { ...state, selectedYear: action.payload };
    case 'SET_TRANSMISSION':
      return { ...state, selectedTransmission: action.payload };
    case 'SET_FUEL_TYPE':
      return { ...state, selectedFuelType: action.payload };
    case 'TOGGLE_SHOW_ALL_BRANDS':
      return { ...state, showAllBrands: !state.showAllBrands };
    case 'TOGGLE_SHOW_ALL_MODELS':
      return { ...state, showAllModels: !state.showAllModels };
    case 'TOGGLE_SHOW_ALL_YEARS':
      return { ...state, showAllYears: !state.showAllYears };
    case 'RESET_FILTERS':
      return {
        ...initialState,
        isFilterVisible: state.isFilterVisible // Garde la visibilité du filtre ouverte
      };
    default:
      throw new Error();
  }
}

const SearchPage = () => {
  const location = useLocation();
  const { language } = useContext(LanguageContext);
  const t = translations[language];

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterState, dispatch] = useReducer(filterReducer, initialState);

  const {
    isFilterVisible,
    priceRange,
    selectedBrand,
    selectedModel,
    selectedYear,
    selectedTransmission,
    selectedFuelType,
    showAllBrands,
    showAllModels,
    showAllYears,
  } = filterState;

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        let query = supabase.from('vehicles').select(`
          *,
          agencies (
            name,
            address,
            latitude,
            longitude
          )
        `);

        // Appliquer les filtres
        query = query.gte('price_per_day', priceRange[0]);
        query = query.lte('price_per_day', priceRange[1]);

        if (selectedBrand) {
          query = query.eq('brand', selectedBrand);
        }
        if (selectedModel) {
          query = query.eq('model', selectedModel);
        }
        if (selectedYear) {
          query = query.eq('year', selectedYear);
        }
        if (selectedTransmission) {
          query = query.eq('transmission', selectedTransmission);
        }
        if (selectedFuelType) {
          query = query.eq('fuel_type', selectedFuelType);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }
        setVehicles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [priceRange, selectedBrand, selectedModel, selectedYear, selectedTransmission, selectedFuelType]);

  const brands = [...new Set(carData.map(car => car.brand))];
  const models = selectedBrand ? [...new Set(carData.filter(car => car.brand === selectedBrand).map(car => car.model))] : [];
  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

  const displayedBrands = showAllBrands ? brands : brands.slice(0, 10);
  const displayedModels = showAllModels ? models : models.slice(0, 10);
  const displayedYears = showAllYears ? years : years.slice(0, 10);

  const handlePriceChange = (event, newValue) => {
    dispatch({ type: 'SET_PRICE_RANGE', payload: newValue });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Section des filtres */}
      <aside className={`w-full lg:w-1/4 p-4 bg-gray-50 border-r ${isFilterVisible ? 'block' : 'hidden'} lg:block`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t.filters}</h2>
            <button
                onClick={() => dispatch({ type: 'RESET_FILTERS' })}
                className="text-sm text-blue-600 hover:underline"
            >
                {t.resetFilters}
            </button>
        </div>

        {/* Filtre par prix */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">{t.priceRange}</label>
          <input
            type="range"
            min="0"
            max="50000"
            value={priceRange[0]}
            onChange={(e) => dispatch({ type: 'SET_PRICE_RANGE', payload: [Number(e.target.value), priceRange[1]] })}
            className="w-full"
          />
           <input
            type="range"
            min="0"
            max="50000"
            value={priceRange[1]}
            onChange={(e) => dispatch({ type: 'SET_PRICE_RANGE', payload: [priceRange[0], Number(e.target.value)] })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{priceRange[0]} {t.currency}</span>
            <span>{priceRange[1]} {t.currency}</span>
          </div>
        </div>

        {/* Filtres par Marque, Modèle, Année etc. */}
        {/* Marque */}
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">{t.brand}</label>
            {displayedBrands.map(brand => (
                <button key={brand} onClick={() => dispatch({ type: 'SET_BRAND', payload: brand })} className={`w-full text-left p-1 rounded ${selectedBrand === brand ? 'bg-blue-500 text-white' : ''}`}>{brand}</button>
            ))}
            {brands.length > 10 && (
                <button onClick={() => dispatch({ type: 'TOGGLE_SHOW_ALL_BRANDS' })} className="text-blue-500 text-sm">{showAllBrands ? t.showLess : t.showMore}</button>
            )}
        </div>

        {/* Modèle */}
        {selectedBrand && (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">{t.model}</label>
                {displayedModels.map(model => (
                    <button key={model} onClick={() => dispatch({ type: 'SET_MODEL', payload: model })} className={`w-full text-left p-1 rounded ${selectedModel === model ? 'bg-blue-500 text-white' : ''}`}>{model}</button>
                ))}
                {models.length > 10 && (
                    <button onClick={() => dispatch({ type: 'TOGGLE_SHOW_ALL_MODELS' })} className="text-blue-500 text-sm">{showAllModels ? t.showLess : t.showMore}</button>
                )}
            </div>
        )}

        {/* Année */}
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">{t.year}</label>
            {displayedYears.map(year => (
                <button key={year} onClick={() => dispatch({ type: 'SET_YEAR', payload: year })} className={`w-full text-left p-1 rounded ${selectedYear === year ? 'bg-blue-500 text-white' : ''}`}>{year}</button>
            ))}
            {years.length > 10 && (
                <button onClick={() => dispatch({ type: 'TOGGLE_SHOW_ALL_YEARS' })} className="text-blue-500 text-sm">{showAllYears ? t.showLess : t.showMore}</button>
            )}
        </div>

        {/* Transmission */}
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">{t.transmission}</label>
            {['Automatic', 'Manual'].map(type => (
                <button key={type} onClick={() => dispatch({ type: 'SET_TRANSMISSION', payload: type })} className={`w-full text-left p-1 rounded ${selectedTransmission === type ? 'bg-blue-500 text-white' : ''}`}>{t[type.toLowerCase()]}</button>
            ))}
        </div>

        {/* Type de carburant */}
        <div>
            <label className="block text-sm font-medium text-gray-700">{t.fuelType}</label>
            {['Gasoline', 'Diesel', 'Electric', 'Hybrid'].map(type => (
                <button key={type} onClick={() => dispatch({ type: 'SET_FUEL_TYPE', payload: type })} className={`w-full text-left p-1 rounded ${selectedFuelType === type ? 'bg-blue-500 text-white' : ''}`}>{t[type.toLowerCase()]}</button>
            ))}
        </div>
      </aside>

      {/* Section principale avec les résultats et la carte */}
      <main className="w-full lg:w-3/4 p-4">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })}
          className="lg:hidden mb-4 w-full bg-gray-200 p-2 rounded"
        >
          {isFilterVisible ? t.hideFilters : t.showFilters}
        </button>
        <div className="h-64 mb-4">
          <InteractiveMap vehicles={vehicles} />
        </div>
        {loading && <p>{t.loading}</p>}
        {error && <p className="text-red-500">{t.error}: {error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
