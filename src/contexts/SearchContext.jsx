// src/contexts/SearchContext.jsx

import React, { createContext, useState, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

// 1. Créer le contexte
const SearchContext = createContext();

// 2. Créer le Provider
export const SearchProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState(null);

  const performSearch = async (criteria) => {
    setLoading(true);
    setSearchCriteria(criteria); // Sauvegarder les critères pour les réutiliser
    try {
      // Construire la requête de manière dynamique
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          agencies ( name, address )
        `);

      if (criteria.pickupLocation) {
        // Idéalement, la recherche de localisation devrait être plus complexe
        // (ex: recherche par proximité géographique), mais pour l'instant,
        // nous allons filtrer sur l'adresse de l'agence.
        // Cette partie nécessite une table 'agencies' avec une colonne 'address' ou 'wilaya'.
        // Pour cet exemple, je suppose que la localisation est dans la table 'vehicles'
        query = query.ilike('location', `%${criteria.pickupLocation}%`);
      }

      // Ajouter d'autres filtres si nécessaire (type de voiture, etc.)

      const { data, error } = await query;

      if (error) throw error;

      setSearchResults(data || []);

    } catch (error) {
      console.error('Error performing search:', error.message);
      setSearchResults([]); // Vider les résultats en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const value = {
    searchResults,
    loading,
    performSearch,
    searchCriteria,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

// 3. Créer un hook custom pour utiliser le contexte
export const useSearch = () => {
  return useContext(SearchContext);
};
