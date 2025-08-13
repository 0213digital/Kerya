import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// 1. Create the context
const AuthContext = createContext(undefined);

// 2. Create the Provider component
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true); // Start as true
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
    const navigate = useNavigate();

    const fetchProfile = useCallback(async (user) => {
        if (user) {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (error) {
                console.error('Error fetching profile:', error);
                setProfile(null);
            } else {
                setProfile(data);
            }
        } else {
            setProfile(null);
        }
    }, []);

    useEffect(() => {
        // onAuthStateChange is the single source of truth.
        // It fires once on load and on every auth change.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true);
                setSession(session);
            } else {
                setIsPasswordRecovery(false);
                setSession(session);
                await fetchProfile(session?.user);
            }
            // Set loading to false only after the initial auth state has been determined.
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
        navigate('/');
    };

    const value = {
        session,
        profile,
        loading,
        handleLogout,
        isAdmin: profile?.role === 'admin',
        isAgencyOwner: profile?.is_agency_owner || false,
        isAuthenticated: !!session && !isPasswordRecovery,
    };
    
    // The App component itself will show the loading spinner, so we can render children here.
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// 3. Create the custom hook with a check for the provider
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};