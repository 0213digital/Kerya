import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// 1. Create the context
const AuthContext = createContext(undefined);

// 2. Create the Provider component
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true);
                setSession(session);
            } else {
                setIsPasswordRecovery(false);
                setSession(session);
                await fetchProfile(session?.user);
            }
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
        fetchProfile,
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

// 3. Create the custom hook for easy consumption
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};