import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const SessionContext = createContext();

export function SessionProvider({ children }) {
    const [session, setSession] = useState(null);
    const [authEvent, setAuthEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Immediately try to get the current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false); // Initial load is done
        });

        // Then, listen for any auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setAuthEvent(event);
            setLoading(false); // Update loading state on any change
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = { session, authEvent, loading };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => {
    return useContext(SessionContext);
};