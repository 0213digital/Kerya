import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { UploadCloud, Palette, FileText } from 'lucide-react';

export function AgencySettingsPage() {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const [agency, setAgency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [settings, setSettings] = useState({
        invoice_logo_url: '',
        invoice_brand_color: '#4f46e5', // Default to indigo
        invoice_terms: ''
    });

    const fetchAgencySettings = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('agencies')
            .select('id, invoice_logo_url, invoice_brand_color, invoice_terms')
            .eq('owner_id', profile.id)
            .single();

        if (data) {
            setAgency(data);
            setSettings({
                invoice_logo_url: data.invoice_logo_url || '',
                invoice_brand_color: data.invoice_brand_color || '#4f46e5',
                invoice_terms: data.invoice_terms || ''
            });
        }
        setLoading(false);
    }, [profile]);

    useEffect(() => {
        fetchAgencySettings();
    }, [fetchAgencySettings]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !agency) return;

        setUploading(true);
        const filePath = `public/invoice-logos/${agency.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
            .from('webpics') // Assuming 'webpics' is your public bucket for images
            .upload(filePath, file);

        if (uploadError) {
            alert(uploadError.message);
        } else {
            const { data } = supabase.storage.from('webpics').getPublicUrl(filePath);
            setSettings(prev => ({ ...prev, invoice_logo_url: data.publicUrl }));
        }
        setUploading(false);
    };

    const handleSaveSettings = async () => {
        if (!agency) return;
        setSaving(true);
        const { error } = await supabase
            .from('agencies')
            .update({
                invoice_logo_url: settings.invoice_logo_url,
                invoice_brand_color: settings.invoice_brand_color,
                invoice_terms: settings.invoice_terms
            })
            .eq('id', agency.id);

        if (error) {
            alert(error.message);
        } else {
            alert('Settings saved successfully!');
        }
        setSaving(false);
    };

    return (
        <DashboardLayout title="Invoice Settings" description="Customize the appearance of your generated invoices.">
            {loading ? (
                <p>{t('loading')}</p>
            ) : (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md space-y-8">
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                            <UploadCloud className="mr-2 h-6 w-6 text-indigo-500" />
                            Invoice Logo
                        </h3>
                        <div className="mt-4 flex items-center space-x-6">
                            <div className="shrink-0">
                                {settings.invoice_logo_url ? (
                                    <img className="h-16 w-auto object-contain" src={settings.invoice_logo_url} alt="Current Logo" />
                                ) : (
                                    <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                        No Logo
                                    </div>
                                )}
                            </div>
                            <label className="block">
                                <span className="sr-only">Choose logo file</span>
                                <input 
                                    type="file" 
                                    onChange={handleLogoUpload}
                                    disabled={uploading}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    accept="image/png, image/jpeg"
                                />
                            </label>
                        </div>
                         {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                    </div>

                    <div className="border-t border-gray-200 pt-8">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                            <Palette className="mr-2 h-6 w-6 text-indigo-500" />
                            Brand Color
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">Choose a color for the invoice header and titles.</p>
                        <div className="mt-4 flex items-center space-x-4">
                            <input
                                type="color"
                                name="invoice_brand_color"
                                value={settings.invoice_brand_color}
                                onChange={handleInputChange}
                                className="h-10 w-10 p-1 border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="invoice_brand_color"
                                value={settings.invoice_brand_color}
                                onChange={handleInputChange}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="#4f46e5"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-8">
                         <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                            <FileText className="mr-2 h-6 w-6 text-indigo-500" />
                            Terms & Conditions
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">This text will appear at the bottom of every invoice.</p>
                        <div className="mt-4">
                            <textarea
                                name="invoice_terms"
                                rows="4"
                                value={settings.invoice_terms}
                                onChange={handleInputChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="e.g., The vehicle must be returned in the same condition..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleSaveSettings}
                                disabled={saving || uploading}
                                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                            >
                                {saving ? t('processing') : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

