import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { DashboardLayout } from '../../components/DashboardLayout';
import { MonthlyRevenueChart } from '../../components/dashboard/MonthlyRevenueChart';
import { List, Car, Banknote, Star, BarChart2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// La fonction de fetch est maintenant à l'extérieur du composant
const fetchAgencyStats = async (profileId, t) => {
    if (!profileId) return null;

    const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', profileId)
        .single();

    if (agencyError || !agency) {
        throw new Error(agencyError?.message || "Agency not found");
    }
    const agencyId = agency.id;

    const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, daily_rate_dzd')
        .eq('agency_id', agencyId);

    if (vehiclesError) throw vehiclesError;
    
    const vehicleIds = vehicles.map(v => v.id);
    const listingsCount = vehicleIds.length;
    if (listingsCount === 0) {
        return {
            listings: 0, activeRentals: 0, totalRevenue: 0, occupancyRate: 0,
            avgRevenuePerVehicle: 0, totalReviews: 0, monthlyRevenue: [],
            topVehicles: [], recentReviews: []
        };
    }
    
    const { data: bookings } = await supabase.from('bookings').select('vehicle_id, total_price, start_date, end_date').in('vehicle_id', vehicleIds);
    const { data: reviewsData } = await supabase.from('reviews').select('id, comment, vehicle_rating, created_at, profiles(full_name)').in('vehicle_id', vehicleIds).order('created_at', { ascending: false }).limit(5);

    let activeRentalsCount = 0;
    let totalRevenue = 0;
    const today = new Date();
    let totalBookedDays = 0;
    const revenueByVehicle = {};
    const monthlyRevenueData = {};

    if (bookings) {
        bookings.forEach(b => {
            totalRevenue += b.total_price;
            const startDate = new Date(b.start_date);
            const endDate = new Date(b.end_date);
            if (today >= startDate && today <= endDate) activeRentalsCount++;
            const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            totalBookedDays += duration;
            revenueByVehicle[b.vehicle_id] = (revenueByVehicle[b.vehicle_id] || 0) + b.total_price;
            const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
            monthlyRevenueData[monthKey] = (monthlyRevenueData[monthKey] || 0) + b.total_price;
        });
    }

    const { data: vehicleDetails } = await supabase.from('vehicles').select('id, make, model').in('id', Object.keys(revenueByVehicle));
    const vehicleMap = new Map(vehicleDetails.map(v => [v.id, `${v.make} ${v.model}`]));
    const sortedTopVehicles = Object.entries(revenueByVehicle).sort(([,a],[,b]) => b - a).slice(0, 5).map(([id, revenue]) => ({ name: vehicleMap.get(parseInt(id, 10)), revenue }));

    const last12Months = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return { month: d.toLocaleString(t('locale'), { month: 'short' }), revenue: monthlyRevenueData[monthKey] || 0 };
    });

    const totalPossibleDays = listingsCount * 365;
    const occupancyRate = totalPossibleDays > 0 ? (totalBookedDays / totalPossibleDays) * 100 : 0;
    const avgRevenuePerVehicle = listingsCount > 0 ? totalRevenue / listingsCount : 0;

    return {
        listings: listingsCount,
        activeRentals: activeRentalsCount,
        totalRevenue: totalRevenue,
        occupancyRate: occupancyRate.toFixed(1),
        avgRevenuePerVehicle: Math.round(avgRevenuePerVehicle),
        totalReviews: (reviewsData || []).length,
        monthlyRevenue: last12Months,
        topVehicles: sortedTopVehicles,
        recentReviews: reviewsData || []
    };
};


export function AgencyDashboardPage() {
    const { t } = useTranslation();
    const { profile } = useAuth();

    // Utilisation de useQuery pour le fetch, la mise en cache, et la gestion des états
    const { data: stats, isLoading } = useQuery({
        queryKey: ['agencyStats', profile?.id],
        queryFn: () => fetchAgencyStats(profile.id, t),
        enabled: !!profile, // La requête ne s'exécute que si `profile` existe
        initialData: { // Fournit des données initiales pour éviter les erreurs d'affichage
            listings: 0, activeRentals: 0, totalRevenue: 0, occupancyRate: 0,
            avgRevenuePerVehicle: 0, totalReviews: 0, monthlyRevenue: [],
            topVehicles: [], recentReviews: []
        }
    });

    return (
        <DashboardLayout title={t('agencyDashboardTitle')} description={t('agencyDashboardDesc')}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><List size={32} className="text-indigo-500 mr-4" /><div><h3 className="text-slate-500">{t('totalListings')}</h3><p className="text-3xl font-bold mt-2">{isLoading ? '...' : stats.listings}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Car size={32} className="text-green-500 mr-4" /><div><h3 className="text-slate-500">{t('activeRentals')}</h3><p className="text-3xl font-bold mt-2">{isLoading ? '...' : stats.activeRentals}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Banknote size={32} className="text-blue-500 mr-4" /><div><h3 className="text-slate-500">{t('totalRevenue')}</h3><p className="text-3xl font-bold mt-2">{isLoading ? '...' : stats.totalRevenue.toLocaleString()}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><BarChart2 size={32} className="text-amber-500 mr-4" /><div><h3 className="text-slate-500">{t('occupancyRate')}</h3><p className="text-3xl font-bold mt-2">{isLoading ? '...' : `${stats.occupancyRate}%`}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Banknote size={32} className="text-teal-500 mr-4" /><div><h3 className="text-slate-500">{t('avgRevenuePerVehicle')}</h3><p className="text-3xl font-bold mt-2">{isLoading ? '...' : stats.avgRevenuePerVehicle.toLocaleString()}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Star size={32} className="text-yellow-500 mr-4" /><div><h3 className="text-slate-500">{t('totalReviews')}</h3><p className="text-3xl font-bold mt-2">{isLoading ? '...' : stats.totalReviews}</p></div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <MonthlyRevenueChart data={stats.monthlyRevenue} t={t} />
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">{t('topPerformingVehicles')}</h3>
                        <ul className="space-y-3">
                            {stats.topVehicles.map(v => (
                                <li key={v.name} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-700">{v.name}</span>
                                    <span className="font-bold text-green-600">{v.revenue.toLocaleString()} DZD</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">{t('recentReviews')}</h3>
                        <ul className="space-y-4">
                            {stats.recentReviews.map(r => (
                                <li key={r.id} className="text-sm border-b border-slate-100 pb-2">
                                    <p className="text-slate-600">"{r.comment}"</p>
                                    <p className="text-xs text-slate-400 mt-1">- {r.profiles.full_name}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}