import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
// CORRECTION : Importer depuis votre contexte de langue local
import { useTranslation } from './LanguageContext';

export const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  // CORRECTION : 'i18n' est remplacé par 'setLanguage' qui vient de votre contexte
  const { t, setLanguage } = useTranslation(); 
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const getProfile = useCallback(async (user) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (data) {
        setProfile(data);
        if (data.language) {
          // CORRECTION : Utiliser setLanguage pour changer la langue
          setLanguage(data.language);
        }
      }
    } catch (error) {
      console.error('An error occurred in getProfile:', error.message);
    } finally {
      setLoading(false);
    }
  }, [setLanguage]); // Ajout de setLanguage aux dépendances

  useEffect(() => {
    if (session?.user) {
      getProfile(session.user);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [session, getProfile]);

  // J'ai renommé loading en loadingProfile pour être plus spécifique et éviter les conflits
  const value = {
    profile,
    loadingProfile: loading, 
    setProfile,
    session,
    // Ajout des helpers isAdmin et isAgencyOwner pour un accès facile
    isAdmin: profile?.role === 'admin',
    isAgencyOwner: profile?.is_agency_owner || false,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

// J'ajoute un hook personnalisé pour consommer ce contexte plus facilement
export const useProfile = () => {
    return useContext(ProfileContext);
};