import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
    const navigate = useNavigate();

    const fetchProfile = useCallback(async (user) => {
        if (user) {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(error ? null : data);
        } else {
            setProfile(null);
        }
    }, []);

    useEffect(() => {
        // Set loading to true on mount
        setLoading(true);

        // onAuthStateChange is the single source of truth for all auth events.
        // It fires once on initial load and again for any sign-in/sign-out event.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true);
                setSession(session);
            } else {
                setIsPasswordRecovery(false);
                setSession(session);
                await fetchProfile(session?.user);
            }
            // This is the crucial part: set loading to false after the first auth event is handled.
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

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};