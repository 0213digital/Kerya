import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useSession } from '../contexts/SessionContext';
import { toast } from 'react-hot-toast';

export function UpdatePasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { session, loading: sessionLoading } = useSession();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!sessionLoading && !session) {
            toast.error(t('updatePasswordNoSession'));
        }
    }, [session, sessionLoading, t]);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!session) {
            toast.error(t('updatePasswordNoSession'));
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({ password: password });

        if (updateError) {
            toast.error(updateError.message);
        } else {
            await supabase.auth.signOut();
            navigate('/login', { state: { message: t('updatePasswordSuccessMessage') } });
        }
        setLoading(false);
    };

    if (sessionLoading) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div></div>;
    }

    return (
        <div className="container mx-auto max-w-md py-16 px-4">
            <form onSubmit={handlePasswordUpdate} className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">{t('updatePasswordTitle')}</h2>
                
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
                        disabled={loading || !session}
                        className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {loading ? t('processing') : t('updatePasswordButton')}
                    </button>
                </div>
            </form>
        </div>
    );
}
