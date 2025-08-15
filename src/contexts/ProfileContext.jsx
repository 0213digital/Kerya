import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSession } from './SessionContext';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
    const { session, authEvent } = useSession();
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (session?.user && authEvent !== 'PASSWORD_RECOVERY') {
                setLoadingProfile(true);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // Gère l'erreur où le profil n'est pas encore créé juste après l'inscription.
                // Ce n'est pas une erreur critique, donc on évite de l'afficher dans la console.
                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error);
                }
                
                setProfile(data); // `data` sera null si une erreur se produit, ce qui est le comportement attendu.
                setLoadingProfile(false);
            } else {
                setProfile(null);
                setLoadingProfile(false);
            }
        };

        fetchProfile();
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
