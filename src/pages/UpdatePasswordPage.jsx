import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';

export function UpdatePasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [session, setSession] = useState(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSession(session);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!session) {
            setError(t('updatePasswordNoSession'));
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({ password: password });

        if (updateError) {
            setError(updateError.message);
        } else {
            // Déconnexion de l'utilisateur après la mise à jour
            await supabase.auth.signOut();
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        }
        setLoading(false);
    };

    return (
        <div className="container mx-auto max-w-md py-16 px-4">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">{t('updatePasswordTitle')}</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{t('updatePasswordSuccess')}</div>}
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
                        disabled={loading || success}
                        className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {loading ? t('processing') : t('updatePasswordButton')}
                    </button>
                </div>
            </form>
        </div>
    );
}