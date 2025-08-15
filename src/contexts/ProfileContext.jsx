import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSession } from './SessionContext';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
    const { session, authEvent } = useSession();
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        // Fonction qui tente de récupérer le profil avec plusieurs essais
        const fetchProfileWithRetry = async (user, retries = 3, delay = 500) => {
            for (let i = 0; i < retries; i++) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                // Si la récupération réussit, on retourne les données
                if (!error) return { data, error: null };

                // Si l'erreur est celle attendue (profil non encore créé) et qu'il reste des essais,
                // on attend un peu avant de réessayer.
                if (error.code === 'PGRST116' && i < retries - 1) {
                    await new Promise(res => setTimeout(res, delay));
                } else {
                    // Pour toute autre erreur, ou après le dernier essai, on retourne l'erreur.
                    return { data: null, error };
                }
            }
        };

        const getProfile = async () => {
            if (session?.user && authEvent !== 'PASSWORD_RECOVERY') {
                setLoadingProfile(true);
                const { data, error } = await fetchProfileWithRetry(session.user);

                // On n'affiche plus l'erreur PGRST116 dans la console, mais on affiche les autres erreurs potentielles.
                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error);
                }
                
                setProfile(data);
                setLoadingProfile(false);
            } else {
                setProfile(null);
                setLoadingProfile(false);
            }
        };

        getProfile();
    }, [session, authEvent]);

    const value = {
        profile,
        loadingProfile,
        isAdmin: profile?.role === 'admin',
        isAgencyOwner: profile?.is_agency_owner || false,
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
}

export const useProfile = () => {
    return useContext(ProfileContext);
};
