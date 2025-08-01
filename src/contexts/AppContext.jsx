import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Charger les véhicules
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*');
        if (vehiclesError) throw vehiclesError;
        setVehicles(vehiclesData || []);

        // Charger les agences
        const { data: agenciesData, error: agenciesError } = await supabase
          .from('agencies')
          .select('*');
        if (agenciesError) throw agenciesError;
        setAgencies(agenciesData || []);

      } catch (error) {
        console.error('Error fetching initial data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const value = {
    vehicles,
    agencies,
    loading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};