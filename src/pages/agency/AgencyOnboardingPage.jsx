import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/DashboardLayout';
import { FileUploadBox } from '../../components/modals';
import { algeriaGeoData } from '../../data/geoAndCarData';

export function AgencyOnboardingPage() {
    const { t } = useTranslation();
    const { profile, session } = useAuth();
    const navigate = useNavigate();
    const [formState, setFormState] = useState({ agency_name: '', address: '', city: '', wilaya: '', trade_register_number: '', trade_register_url: '', id_card_url: '', selfie_url: '' });
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isReapplying, setIsReapplying] = useState(false);
    const [uploading, setUploading] = useState({ trade_register: false, id_card: false, selfie: false });
    const [error, setError] = useState('');
    const wilayas = Object.keys(algeriaGeoData);

    useEffect(() => {
        const checkForExistingAgency = async () => {
            if (!profile || !session) return;
            const initialAgencyName = session.user?.user_metadata?.agency_name || '';
            const { data } = await supabase.from('agencies').select('*').eq('owner_id', profile.id).single();
            if (data) {
                setFormState(data);
                setIsReapplying(true);
                if (data.wilaya) setCities(algeriaGeoData[data.wilaya] || []);
            } else {
                setFormState(prev => ({ ...prev, agency_name: initialAgencyName }));
            }
        };
        checkForExistingAgency();
    }, [profile, session]);

    const handleWilayaChange = (e) => {
        const selectedWilaya = e.target.value;
        setFormState(prev => ({...prev, wilaya: selectedWilaya, city: ''}));
        setCities(algeriaGeoData[selectedWilaya] || []);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: value}));
    };

    const handleFileUpload = async (e, fileType) => {
        const file = e.target.files[0];
        if (!file || !profile) return;
        setUploading(prev => ({ ...prev, [fileType]: true }));
        setError('');
        const fileName = `${fileType}/${profile.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('agency-documents').upload(fileName, file);
        if (uploadError) setError(uploadError.message);
        else {
            const { data } = supabase.storage.from('agency-documents').getPublicUrl(fileName);
            setFormState(prev => ({ ...prev, [`${fileType}_url`]: data.publicUrl }));
        }
        setUploading(prev => ({ ...prev, [fileType]: false }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.trade_register_url || !formState.id_card_url || !formState.selfie_url) { setError(t('uploadAllDocs')); return; }
        setLoading(true);
        setError('');
        const { id, owner_id, ...updateData } = formState;
        const query = isReapplying
            ? supabase.from('agencies').update({ ...updateData, verification_status: 'pending', rejection_reason: null }).eq('owner_id', profile.id)
            : supabase.from('agencies').insert([{ ...formState, owner_id: profile.id }]);
        const { error: queryError } = await query;
        if (queryError) setError(queryError.message);
        else navigate('/dashboard/agency/vehicles');
        setLoading(false);
    };

    return (
        <DashboardLayout title={isReapplying ? t('updateYourAgencyTitle') : t('createYourAgencyTitle')} description={isReapplying ? t('updateYourAgencyDesc') : t('createYourAgencyDesc')}>
            <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                    <div><label className="block text-sm font-medium">{t('agencyName')}</label><input name="agency_name" type="text" value={formState.agency_name} onChange={handleChange} required className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                    <div><label className="block text-sm font-medium">{t('wilaya')}</label><select name="wilaya" value={formState.wilaya} onChange={handleWilayaChange} required className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"><option value="">{t('selectWilaya')}</option>{wilayas.map(w => <option key={w} value={w}>{w}</option>)}</select></div>
                    <div><label className="block text-sm font-medium">{t('city')}</label><select name="city" value={formState.city} onChange={handleChange} required disabled={!formState.wilaya} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white disabled:bg-slate-50"><option value="">{t('selectCity')}</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="block text-sm font-medium">{t('address')}</label><input name="address" type="text" value={formState.address} onChange={handleChange} required className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                    <div><label className="block text-sm font-medium">{t('tradeRegister')}</label><input name="trade_register_number" type="text" value={formState.trade_register_number} onChange={handleChange} required className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                    <FileUploadBox type="trade_register" label={t('tradeRegisterUpload')} url={formState.trade_register_url} uploading={uploading.trade_register} onChange={handleFileUpload} />
                    <FileUploadBox type="id_card" label={t('idCardUpload')} url={formState.id_card_url} uploading={uploading.id_card} onChange={handleFileUpload} />
                    <FileUploadBox type="selfie" label={t('selfieUpload')} url={formState.selfie_url} uploading={uploading.selfie} onChange={handleFileUpload} />
                    <button type="submit" disabled={loading || Object.values(uploading).some(u => u)} className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">{loading ? t('loading') : (isReapplying ? t('updateAgencyButton') : t('createAgencyButton'))}</button>
                </form>
            </div>
        </DashboardLayout>
    );
}