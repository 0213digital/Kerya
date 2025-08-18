import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { DashboardLayout } from '../../components/DashboardLayout';
import { MonthlyRevenueChart } from '../../components/dashboard/MonthlyRevenueChart';
import { List, Car, Banknote, Star, BarChart2 } from 'lucide-react';

export function AgencyDashboardPage() {
    const { t, language } = useTranslation();
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        listings: 0,
        activeRentals: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        avgRevenuePerVehicle: 0,
        totalReviews: 0,
    });
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [topVehicles, setTopVehicles] = useState([]);
    const [recentReviews, setRecentReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!profile) return;
            setLoading(true);

            const { data: agency, error: agencyError } = await supabase
                .from('agencies')
                .select('id')
                .eq('owner_id', profile.id)
                .single();

            if (agencyError || !agency) {
                console.error("Error fetching agency for stats:", agencyError);
                setLoading(false);
                return;
            }
            const agencyId = agency.id;

            const { data: vehicles, error: vehiclesError } = await supabase
                .from('vehicles')
                .select('id, daily_rate_dzd')
                .eq('agency_id', agencyId);

            if (vehiclesError) {
                setLoading(false);
                return;
            }
            const vehicleIds = vehicles.map(v => v.id);
            const listingsCount = vehicleIds.length;
            if (listingsCount === 0) {
                setLoading(false);
                return;
            }

            const { data: bookings } = await supabase
                .from('bookings')
                .select('vehicle_id, total_price, start_date, end_date')
                .in('vehicle_id', vehicleIds);

            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('id, comment, rating, created_at, profiles(full_name)')
                .in('vehicle_id', vehicleIds)
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentReviews(reviewsData || []);

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

                    if (today >= startDate && today <= endDate) {
                        activeRentalsCount++;
                    }

                    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    totalBookedDays += duration;

                    revenueByVehicle[b.vehicle_id] = (revenueByVehicle[b.vehicle_id] || 0) + b.total_price;

                    const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
                    monthlyRevenueData[monthKey] = (monthlyRevenueData[monthKey] || 0) + b.total_price;
                });
            }

            const { data: vehicleDetails } = await supabase.from('vehicles').select('id, make, model').in('id', Object.keys(revenueByVehicle));
            const vehicleMap = new Map(vehicleDetails.map(v => [v.id, `${v.make} ${v.model}`]));
            const sortedTopVehicles = Object.entries(revenueByVehicle)
                .sort(([,a],[,b]) => b - a)
                .slice(0, 5)
                .map(([id, revenue]) => ({ name: vehicleMap.get(parseInt(id, 10)), revenue }));
            setTopVehicles(sortedTopVehicles);

            const last12Months = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                last12Months.push({
                    month: d.toLocaleString(t('locale'), { month: 'short' }),
                    revenue: monthlyRevenueData[monthKey] || 0
                });
            }
            setMonthlyRevenue(last12Months);

            const totalPossibleDays = listingsCount * 365;
            const occupancyRate = totalPossibleDays > 0 ? (totalBookedDays / totalPossibleDays) * 100 : 0;
            const avgRevenuePerVehicle = listingsCount > 0 ? totalRevenue / listingsCount : 0;

            setStats({
                listings: listingsCount,
                activeRentals: activeRentalsCount,
                totalRevenue: totalRevenue,
                occupancyRate: occupancyRate.toFixed(1),
                avgRevenuePerVehicle: Math.round(avgRevenuePerVehicle),
                totalReviews: reviewsData.length,
            });
            setLoading(false);
        };

        fetchStats();
    }, [profile, t, language]);

    return (
        <DashboardLayout title={t('agencyDashboardTitle')} description={t('agencyDashboardDesc')}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><List size={32} className="text-indigo-500 mr-4" /><div><h3 className="text-slate-500">{t('totalListings')}</h3><p className="text-3xl font-bold mt-2">{loading ? '...' : stats.listings}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Car size={32} className="text-green-500 mr-4" /><div><h3 className="text-slate-500">{t('activeRentals')}</h3><p className="text-3xl font-bold mt-2">{loading ? '...' : stats.activeRentals}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Banknote size={32} className="text-blue-500 mr-4" /><div><h3 className="text-slate-500">{t('totalRevenue')}</h3><p className="text-3xl font-bold mt-2">{loading ? '...' : stats.totalRevenue.toLocaleString()}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><BarChart2 size={32} className="text-amber-500 mr-4" /><div><h3 className="text-slate-500">{t('occupancyRate')}</h3><p className="text-3xl font-bold mt-2">{loading ? '...' : `${stats.occupancyRate}%`}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Banknote size={32} className="text-teal-500 mr-4" /><div><h3 className="text-slate-500">{t('avgRevenuePerVehicle')}</h3><p className="text-3xl font-bold mt-2">{loading ? '...' : stats.avgRevenuePerVehicle.toLocaleString()}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Star size={32} className="text-yellow-500 mr-4" /><div><h3 className="text-slate-500">{t('totalReviews')}</h3><p className="text-3xl font-bold mt-2">{loading ? '...' : stats.totalReviews}</p></div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <MonthlyRevenueChart data={monthlyRevenue} t={t} />
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">{t('topPerformingVehicles')}</h3>
                        <ul className="space-y-3">
                            {topVehicles.map(v => (
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
                            {recentReviews.map(r => (
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