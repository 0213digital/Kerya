import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { session, isAuthenticated, loading: authLoading } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('login');
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    useEffect(() => {
        const handleAuthRedirect = async () => {
            const params = new URLSearchParams(location.hash.substring(1));
            // Gère la redirection après la confirmation de l'e-mail de l'utilisateur
            if (params.get('type') === 'signup' && session) {
                await supabase.auth.signOut(); // Déconnecte l'utilisateur pour forcer une connexion manuelle
                // Utilise l'état de navigation pour afficher le message de succès et nettoyer l'URL
                navigate('/login', { replace: true, state: { message: t('emailVerified') } });
            } 
            // Gère la redirection des utilisateurs déjà connectés
            else if (!authLoading && isAuthenticated) {
                navigate('/');
            }
        };

        handleAuthRedirect();
    }, [isAuthenticated, authLoading, navigate, location.hash, session, t]);

    useEffect(() => {
        // Gère les messages passés dans l'état de la localisation
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Efface l'état de la localisation pour éviter de remontrer le message au rafraîchissement
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        const isEmail = identifier.includes('@');
        const loginData = isEmail
            ? { email: identifier, password }
            : { phone: `+213${identifier.replace(/\s/g, '')}`, password };

        // Tente de connecter l'utilisateur
        const { data: loginResponse, error: loginError } = await supabase.auth.signInWithPassword(loginData);

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
            return;
        }

        // Si la connexion réussit, vérifie le statut de suspension du profil de l'utilisateur
        if (loginResponse.user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_suspended')
                .eq('id', loginResponse.user.id)
                .single();
            
            if (profile?.is_suspended) {
                setError(t('userSuspendedError'));
                await supabase.auth.signOut();
            } else if (profileError) {
                setError(t('profileError'));
                await supabase.auth.signOut();
            }
            else {
                navigate('/');
            }
        }
        setLoading(false);
    };
    
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResetSuccess(false);
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) {
            setError(error.message);
        } else {
            setResetSuccess(true);
        }
        setLoading(false);
    };
    
    // N'affiche le spinner que si l'authentification est en cours ET qu'il n'y a pas de message de succès à afficher
    if (authLoading && !location.state?.message) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (view === 'forgot_password') {
        return (
            <div className="container mx-auto max-w-md py-16 px-4">
                <form onSubmit={handleForgotPassword} className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-center mb-6">{t('resetPassword')}</h2>
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                    {resetSuccess && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{t('passwordResetSent')}</div>}
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium">{t('email')}</label><input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required placeholder="you@example.com" className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">{loading ? t('loading') : t('sendResetInstructions')}</button>
                    </div>
                    <p className="text-center text-sm mt-4"><button type="button" onClick={() => setView('login')} className="text-indigo-600 hover:underline">{t('backToLogin')}</button></p>
                </form>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-md py-16 px-4">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">{t('loginTitle')}</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{successMessage}</div>}
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium">{t('loginIdentifier')}</label><input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder="you@example.com or 550123456" className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                    <div><label className="block text-sm font-medium">{t('password')}</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                    <div className="text-right text-sm"><button type="button" onClick={() => setView('forgot_password')} className="font-medium text-indigo-600 hover:text-indigo-500">{t('forgotPassword')}</button></div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">{loading ? t('loading') : t('login')}</button>
                </div>
                <p className="text-center text-sm mt-4">{t('noAccount')} <Link to="/signup" className="text-indigo-600 hover:underline">{t('signup')}</Link></p>
            </form>
        </div>
    );
}
