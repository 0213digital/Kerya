import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext';

export function UpdatePasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { session, loading: sessionLoading } = useSession(); // On utilise la session et l'état de chargement du contexte
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cet effet gère l'affichage d'une erreur si, après le chargement, aucune session n'est trouvée.
    useEffect(() => {
        if (!sessionLoading && !session) {
            setError(t('updatePasswordNoSession'));
        }
        // Si la session apparaît, on retire le message d'erreur.
        if (session) {
            setError(null);
        }
    }, [session, sessionLoading, t]);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // La vérification est simple : il faut une session pour continuer.
        if (!session) {
            setError(t('updatePasswordNoSession'));
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({ password: password });

        if (updateError) {
            setError(updateError.message);
        } else {
            await supabase.auth.signOut();
            navigate('/login', { state: { message: t('updatePasswordSuccessMessage') } });
        }
        setLoading(false);
    };

    // On affiche un spinner tant que la session est en cours de vérification.
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
                        disabled={loading || !session} // La logique de désactivation est maintenant plus simple et robuste
                        className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {loading ? t('processing') : t('updatePasswordButton')}
                    </button>
                </div>
            </form>
        </div>
    );
}