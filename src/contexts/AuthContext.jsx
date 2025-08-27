import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useSession } from './SessionContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const { session, loading: sessionLoading } = useSession();
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const navigate = useNavigate();

    const fetchProfile = useCallback(async (user) => {
        if (!user) {
            setProfile(null);
            setLoadingProfile(false);
            return;
        }
        setLoadingProfile(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
                setProfile(null);
            } else {
                setProfile(data);
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    useEffect(() => {
        if (session?.user) {
            fetchProfile(session.user);
        } else {
            setProfile(null);
            setLoadingProfile(false);
        }
    }, [session, fetchProfile]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };
    
    const loading = sessionLoading || loadingProfile;
    const isAuthenticated = !!session && !!profile;
    const isAdmin = profile?.role === 'admin';
    const isAgencyOwner = profile?.is_agency_owner || false;
    
    const value = {
        session,
        profile,
        loading,
        handleLogout,
        isAdmin,
        isAgencyOwner,
        isAuthenticated,
        fetchProfile, // Expose fetchProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};