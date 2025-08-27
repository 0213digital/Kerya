import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useSession } from './SessionContext';
import { useProfile } from './ProfileContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const { session, loading: sessionLoading } = useSession();
    const { profile, loadingProfile, isAdmin, isAgencyOwner } = useProfile();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };
    
    // Determine the overall loading state
    const loading = sessionLoading || loadingProfile;

    // Determine authentication status
    const isAuthenticated = !!session && !!profile;

    const value = {
        session,
        profile,
        loading,
        handleLogout,
        isAdmin,
        isAgencyOwner,
        isAuthenticated,
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