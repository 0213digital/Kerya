// src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

// 1. Créer le contexte
const AuthContext = createContext();

// 2. Créer le Provider (Fournisseur)
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Écouter les changements d'état de l'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null); // Nettoyer le profil à la déconnexion
        }
      }
    );

    // Nettoyer l'écouteur
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    }
  };

  const updateProfile = async (profileData) => {
    if (!session) return;
    try {
        setLoading(true);
        const { error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', session.user.id);
        if (error) throw error;
        // Mettre à jour le profil localement
        setProfile(prevProfile => ({...prevProfile, ...profileData}));
    } catch (error) {
        console.error('Error updating profile:', error.message);
    } finally {
        setLoading(false);
    }
  };

  const value = {
    session,
    profile,
    loading,
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, metadata) => supabase.auth.signUp({ email, password, options: { data: metadata } }),
    logout: () => supabase.auth.signOut(),
    updateProfile,
  };

  // Ne rend les enfants que lorsque le chargement initial est terminé
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 3. Créer un hook custom pour utiliser le contexte facilement
export const useAuth = () => {
  return useContext(AuthContext);
};
