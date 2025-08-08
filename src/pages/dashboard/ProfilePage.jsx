import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { User, Edit } from 'lucide-react';

const AVATARS_BUCKET = 'avatars';

export function ProfilePage() {
    const { t } = useTranslation();
    // Get the fetchProfile function from the context
    const { profile, session, fetchProfile } = useContext(AppContext);
    
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setPhoneNumber(profile.phone_number || '');
            setAvatarUrl(profile.avatar_url || null);
        }
    }, [profile]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !profile) return;

        setUploading(true);
        setSuccessMessage('');
        setErrorMessage('');
        const filePath = `${profile.id}/${Date.now()}`;

        const { error: uploadError } = await supabase.storage
            .from(AVATARS_BUCKET)
            .upload(filePath, file);

        if (uploadError) {
            setErrorMessage(uploadError.message);
        } else {
            const { data } = supabase.storage
                .from(AVATARS_BUCKET)
                .getPublicUrl(filePath);

            if (data.publicUrl) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: data.publicUrl })
                    .eq('id', profile.id);

                if (updateError) {
                    setErrorMessage(updateError.message);
                } else {
                    setSuccessMessage(t('profileUpdated'));
                    // Re-fetch the profile to update the UI instantly
                    fetchProfile(session.user);
                }
            }
        }
        setUploading(false);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone_number: phoneNumber,
            })
            .eq('id', profile.id);

        if (error) {
            setErrorMessage(error.message);
        } else {
            setSuccessMessage(t('profileUpdated'));
            // Re-fetch the profile to update the UI instantly
            fetchProfile(session.user);
        }
        setLoading(false);
    };

    /**
     * Handles changes to the phone number input.
     * It removes any non-digit characters and limits the length.
     */
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove any non-digit characters
        // Algerian numbers are 9 digits after the country code
        if (value.length <= 9) {
            setPhoneNumber(value);
        }
    };

    if (!profile) {
        return <DashboardLayout title={t('profileTitle')} description={t('profileDesc')}><p>{t('loading')}</p></DashboardLayout>;
    }

    return (
        <DashboardLayout title={t('profileTitle')} description={t('profileDesc')}>
            <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{successMessage}</div>}
                    {errorMessage && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{errorMessage}</div>}
                    <div>
                        <label className="block text-sm font-medium text-center">{t('profilePicture')}</label>
                        <div className="mt-2 flex justify-center">
                            <div className="relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center">
                                        <User className="h-12 w-12 text-slate-400" />
                                    </div>
                                )}
                                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full cursor-pointer hover:bg-indigo-700">
                                    <Edit size={16} />
                                    <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" onChange={handleAvatarUpload} disabled={uploading} accept="image/*" />
                                </label>
                            </div>
                        </div>
                        {uploading && <p className="text-center text-sm mt-2">{t('loading')}</p>}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">{t('fullName')}</label>
                            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">{t('email')}</label>
                            <input type="email" value={session?.user?.email || ''} disabled className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-slate-100 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('phoneNumber')}</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">+213</span>
                                <input 
                                    type="tel" 
                                    value={phoneNumber} 
                                    onChange={handlePhoneChange} 
                                    placeholder="550123456"
                                    className="w-full p-2 pl-12 border border-slate-300 rounded-md bg-white" 
                                />
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={loading || uploading} className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">
                        {loading ? t('processing') : t('updateProfile')}
                    </button>
                </form>
            </div>
        </DashboardLayout>
    );
}
