import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useTranslation } from 'react-i18next';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      // Set loading to false after session is fetched
      // The profile will be fetched in the onAuthStateChange listener
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
          i18n.changeLanguage(data.language);
        }
      }
    } catch (error) {
      console.error('An error occurred in getProfile:', error.message);
    } finally {
      setLoading(false);
    }
  }, [i18n]);

  useEffect(() => {
    if (session?.user) {
      getProfile(session.user);
    } else {
      // Handle case where there is no session
      setProfile(null);
      setLoading(false);
    }
  }, [session, getProfile]);

  const value = {
    profile,
    loading,
    setProfile,
    session,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};