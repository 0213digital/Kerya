import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSession } from './SessionContext';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
    const { session } = useSession();
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (session?.user) {
                setLoadingProfile(true);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                    setProfile(null);
                } else {
                    setProfile(data);
                }
                setLoadingProfile(false);
            } else {
                setProfile(null); // Clear profile if there's no session
            }
        };

        fetchProfile();
    }, [session]);

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