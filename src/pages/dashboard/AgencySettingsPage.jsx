import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext'; // Correction de l'import
import { DashboardLayout } from '../../components/DashboardLayout';
import { Settings } from 'lucide-react';

export function AgencySettingsPage() {
    const { profile } = useAuth(); // Correction : on utilise profile
    const { t } = useTranslation();
    const [agency, setAgency] = useState(null);
    const [invoiceLogoUrl, setInvoiceLogoUrl] = useState('');
    const [invoiceBrandColor, setInvoiceBrandColor] = useState('#4f46e5'); // Valeur par défaut
    const [invoiceTerms, setInvoiceTerms] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchAgency = async () => {
            if (profile?.id) { // On vérifie si le profil est chargé
                try {
                    const { data, error } = await supabase
                        .from('agencies')
                        .select('*')
                        .eq('owner_id', profile.id)
                        .single();

                    if (error) throw error;
                    if (data) {
                        setAgency(data);
                        setInvoiceLogoUrl(data.invoice_logo_url || '');
                        setInvoiceBrandColor(data.invoice_brand_color || '#4f46e5');
                        setInvoiceTerms(data.invoice_terms || '');
                    }
                } catch (error) {
                    console.error('Error fetching agency:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchAgency();
    }, [profile]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('agencies')
                .update({
                    invoice_logo_url: invoiceLogoUrl,
                    invoice_brand_color: invoiceBrandColor,
                    invoice_terms: invoiceTerms,
                })
                .eq('id', agency.id);

            if (error) throw error;
            setMessage(t('invoiceSettingsSaved'));
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage(`${t('error')}: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const fileName = `${profile.id}/${Date.now()}-${file.name}`;
        
        try {
            // Le bucket doit être 'agency-logos' pour correspondre à la politique de sécurité
            const { data, error } = await supabase.storage
                .from('agency-logos') 
                .upload(fileName, file);

            if (error) throw error;

            const { data: publicURLData } = supabase.storage
                .from('agency-logos')
                .getPublicUrl(data.path);

            setInvoiceLogoUrl(publicURLData.publicUrl);
        } catch (error) {
            console.error('Error uploading logo:', error);
            setMessage(`${t('error')}: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };
    
    // On met à jour le DashboardLayout pour qu'il soit plus générique
    if (loading) {
        return <DashboardLayout title={t('agencySettings')} description=""><div className="p-4">{t('loading')}...</div></DashboardLayout>;
    }


    return (
        <DashboardLayout title={t('agencySettings')} description="">
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-slate-700 mb-4 border-b pb-2">{t('invoiceCustomization')}</h2>
                    
                    {message && <div className={`mb-4 p-3 rounded-md ${message.startsWith(t('error')) ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>{message}</div>}

                    <form onSubmit={handleSave}>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="invoiceLogoUrl" className="block text-sm font-medium text-slate-600 mb-1">{t('invoiceLogoUrl')}</label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        id="invoiceLogoUrl"
                                        type="text"
                                        value={invoiceLogoUrl}
                                        onChange={(e) => setInvoiceLogoUrl(e.target.value)}
                                        className="flex-grow w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="https://..."
                                    />
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                        accept="image/png, image/jpeg"
                                        disabled={uploading}
                                    />
                                    <label htmlFor="logo-upload" className="cursor-pointer px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition duration-150 ease-in-out">
                                        {uploading ? t('uploading') : t('upload')}
                                    </label>
                                </div>
                                {invoiceLogoUrl && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-slate-600 mb-2">{t('preview')}:</p>
                                        <img src={invoiceLogoUrl} alt={t('imagePreview')} className="h-16 w-auto rounded-md border p-1" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="invoiceBrandColor" className="block text-sm font-medium text-slate-600 mb-1">{t('invoiceBrandColor')}</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="invoiceBrandColor"
                                        type="color"
                                        value={invoiceBrandColor}
                                        onChange={(e) => setInvoiceBrandColor(e.target.value)}
                                        className="p-1 h-10 w-10 block bg-white border border-slate-300 cursor-pointer rounded-md"
                                    />
                                    <input
                                        type="text"
                                        value={invoiceBrandColor}
                                        onChange={(e) => setInvoiceBrandColor(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder={t('brandColorHint')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="invoiceTerms" className="block text-sm font-medium text-slate-600 mb-1">{t('invoiceTerms')}</label>
                                <textarea
                                    id="invoiceTerms"
                                    rows="4"
                                    value={invoiceTerms}
                                    onChange={(e) => setInvoiceTerms(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder={t('termsHint')}
                                ></textarea>
                            </div>
                        </div>

                        <div className="mt-8 pt-5 border-t border-slate-200">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {saving ? t('saving') : t('saveSettings')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}