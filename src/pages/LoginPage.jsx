import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';

export function LoginPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('login');
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const isEmail = identifier.includes('@');
        const loginData = isEmail
            ? { email: identifier, password }
            : { phone: `+213${identifier.replace(/\s/g, '')}`, password };

        // Attempt to sign in the user
        const { data: loginResponse, error: loginError } = await supabase.auth.signInWithPassword(loginData);

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
            return;
        }

        // If login is successful, check the user's profile for suspension status
        if (loginResponse.user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_suspended')
                .eq('id', loginResponse.user.id)
                .single();
            
            // If the user's profile indicates they are suspended...
            if (profile?.is_suspended) {
                // ...set a specific error message and sign them out immediately.
                setError(t('userSuspendedError', 'Your account has been suspended. Please contact support.'));
                await supabase.auth.signOut();
            } else if (profileError) {
                // Handle cases where the profile might not be found
                setError(t('profileError', 'Could not retrieve user profile.'));
                await supabase.auth.signOut();
            }
            else {
                // If not suspended, navigate to the home page
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
