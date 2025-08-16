import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Info } from 'lucide-react';

export function SignUpAgencyPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [agencyName, setAgencyName] = useState(''); // NOUVEAU
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 9) {
            setPhoneNumber(value);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            phone: `+213${phoneNumber}`,
            options: {
                emailRedirectTo: `${window.location.origin}/login`,
                data: {
                    full_name: fullName,
                    is_agency_owner: true,
                    phone_number: phoneNumber,
                    agency_name: agencyName, // NOUVEAU: On passe le nom de l'agence ici
                }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (authLoading || isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-md py-16 px-4">
            <form onSubmit={handleSignUp} className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">{t('createAgencyAccount')}</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4"><p className="font-bold">{t('signupSuccess')}</p><p>{t('checkEmail')}</p></div>}
                
                <div className="mb-4 p-3 bg-sky-50 border-l-4 border-sky-400 text-sky-800 text-sm">
                    <div className="flex">
                        <Info size={20} className="mr-2 flex-shrink-0" />
                        <span>{t('agencySignUpNote')}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div><label className="block text-sm font-medium">{t('agencyName')}</label><input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)} required placeholder={t('agencyNamePlaceholder')} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                    <div><label className="block text-sm font-medium">{t('ownerFullName')}</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder={t('ownerFullNamePlaceholder')} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                    <div><label className="block text-sm font-medium">{t('email')}</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                    <div><label className="block text-sm font-medium">{t('phoneNumber')}</label><div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">+213</span><input type="tel" value={phoneNumber} onChange={handlePhoneChange} required placeholder="550123456" className="w-full p-2 pl-12 border border-slate-300 rounded-md bg-white" /></div></div>
                    <div><label className="block text-sm font-medium">{t('password')}</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                    <button type="submit" disabled={loading || success} className="w-full bg-sky-600 text-white py-2 rounded-md font-semibold hover:bg-sky-700 disabled:bg-sky-400">{loading ? t('loading') : t('signup')}</button>
                </div>
                <p className="text-center text-sm mt-4">{t('haveAccount')} <Link to="/login" className="text-indigo-600 hover:underline">{t('login')}</Link></p>
            </form>
        </div>
    );
}