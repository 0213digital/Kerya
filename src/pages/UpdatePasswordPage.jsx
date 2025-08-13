import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext'; // Import useSession

export function UpdatePasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { session, authEvent, loading: sessionLoading } = useSession(); // Use the context
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRecoverySession, setIsRecoverySession] = useState(false);

    useEffect(() => {
        // We check if the auth event is PASSWORD_RECOVERY
        // This event is triggered when the user lands on this page from the email link
        if (authEvent === 'PASSWORD_RECOVERY' && session) {
            setIsRecoverySession(true);
        }
        // If the page loads and after a moment there's no recovery session, show an error.
        else if (!sessionLoading && !session) {
             setError(t('updatePasswordNoSession'));
        }
    }, [authEvent, session, sessionLoading, t]);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // We must have a session to update the password
        if (!isRecoverySession) {
            setError(t('updatePasswordNoSession'));
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({ password: password });

        if (updateError) {
            setError(updateError.message);
        } else {
            // After successful update, sign the user out and redirect to login with a success message
            await supabase.auth.signOut();
            navigate('/login', { state: { message: t('updatePasswordSuccessMessage') } });
        }
        setLoading(false);
    };
    
    // Show a loading indicator while the session is being processed
    if (sessionLoading) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div></div>;
    }

    return (
        <div className="container mx-auto max-w-md py-16 px-4">
            <form onSubmit={handlePasswordUpdate} className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">{t('updatePasswordTitle')}</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">{t('newPassword')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !isRecoverySession}
                        className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {loading ? t('processing') : t('updatePasswordButton')}
                    </button>
                </div>
            </form>
        </div>
    );
}