import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const SessionContext = createContext();

export function SessionProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Supabase's onAuthStateChange fires on initial load, login, logout, etc.
        // It's the single source of truth for the session state.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false); // Set loading to false once the initial session is retrieved.
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = { session, loading };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => {
    return useContext(SessionContext);
};