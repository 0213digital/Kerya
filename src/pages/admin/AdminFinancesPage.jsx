import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Banknote, Percent, Save } from 'lucide-react';

export function AdminFinancesPage() {
    const { t } = useTranslation();
    const [stats, setStats] = useState({ revenue: 0, commissionAmount: 0 });
    const [commissionRate, setCommissionRate] = useState('');
    const [initialRate, setInitialRate] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchFinanceData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Récupérer le taux de commission
            const { data: setting, error: settingError } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', 'platform_commission_rate')
                .single();
            
            if (settingError) throw settingError;
            
            const rate = setting ? parseFloat(setting.value) : 10; // Default to 10% if not set
            setCommissionRate(rate);
            setInitialRate(rate);

            // Calculer le revenu total
            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('total_price')
                .eq('status', 'returned'); // Only count completed bookings

            if (bookingsError) throw bookingsError;

            const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_price, 0);
            const commissionAmount = totalRevenue * (rate / 100);

            setStats({
                revenue: totalRevenue,
                commissionAmount: commissionAmount,
            });

        } catch (err) {
            console.error("Error fetching finance data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    const handleSaveRate = async () => {
        setSaving(true);
        setError('');
        const newRate = parseFloat(commissionRate);
        if (isNaN(newRate) || newRate < 0 || newRate > 100) {
            setError("Please enter a valid percentage between 0 and 100.");
            setSaving(false);
            return;
        }

        try {
            const { error: updateError } = await supabase
                .from('platform_settings')
                .update({ value: newRate.toString() })
                .eq('key', 'platform_commission_rate');
            
            if (updateError) throw updateError;
            
            // Refresh data after saving
            fetchFinanceData();

        } catch (err) {
             console.error("Error saving commission rate:", err);
             setError(err.message);
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return <DashboardLayout title={t('Finances')} description={t('Manage platform revenue and settings.')}><p>{t('loading')}</p></DashboardLayout>;
    }

    return (
        <DashboardLayout title="Finances" description="Manage platform revenue and settings.">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <Banknote size={32} className="text-green-500 mr-4" />
                    <div>
                        <h3 className="text-slate-500">{t('totalRevenue')}</h3>
                        <p className="text-3xl font-bold mt-2">{stats.revenue.toLocaleString()} <span className="text-lg font-normal">DZD</span></p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <Banknote size={32} className="text-emerald-500 mr-4" />
                    <div>
                        <h3 className="text-slate-500">{t('platformCommission')}</h3>
                        <p className="text-3xl font-bold mt-2">{stats.commissionAmount.toLocaleString()} <span className="text-lg font-normal">DZD</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Commission Settings</h2>
                <div className="flex items-center space-x-4">
                    <div className="relative flex-grow">
                        <input 
                            type="number"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-md pr-10"
                            placeholder="e.g., 10"
                        />
                        <Percent size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <button 
                        onClick={handleSaveRate}
                        disabled={saving || parseFloat(commissionRate) === initialRate}
                        className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
                    >
                        <Save size={18} className="mr-2" />
                        {saving ? t('saving') : t('saveSettings')}
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}