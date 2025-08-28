import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Banknote, FileText, Users, Building, ShieldCheck, Clock, Eye } from 'lucide-react';

export function AdminDashboardPage() {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        users: 0,
        agencies: 0,
        bookings: 0,
        listings: 0,
        revenue: 0,
        platformCommission: 0,
        verificationRate: 0,
    });
    const [agencies, setAgencies] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin === false) { navigate('/'); return; }
        if (isAdmin === true) {
            const fetchAllData = async () => {
                 setLoading(true);

                 const [agenciesRes, usersRes, bookingsRes, listingsRes, profilesRes] = await Promise.all([
                     supabase.from('agencies').select('*'),
                     supabase.from('profiles').select('id', { count: 'exact' }),
                     supabase.from('bookings').select('*'),
                     supabase.from('vehicles').select('id, agency_id, make, model'),
                     supabase.from('profiles').select('id, full_name, created_at, is_agency_owner').order('created_at', { ascending: false })
                 ]);

                 const agenciesData = agenciesRes.data || [];
                 const bookingsData = bookingsRes.data || [];
                 const vehiclesData = listingsRes.data || [];
                 const profilesData = profilesRes.data || [];

                 const profilesMap = new Map(profilesData.map(p => [p.id, p]));

                 const agenciesWithProfiles = agenciesData.map(agency => ({
                     ...agency,
                     profiles: profilesMap.get(agency.owner_id)
                 }));

                 const bookingsWithDetails = bookingsData.map(booking => ({
                     ...booking,
                     vehicles: vehiclesData.find(v => v.id === booking.vehicle_id),
                     profiles: profilesMap.get(booking.user_id)
                 }));

                 const totalRevenue = bookingsData.reduce((sum, booking) => sum + booking.total_price, 0);
                 const platformCommission = totalRevenue * 0.10;
                 const verifiedAgencies = agenciesData.filter(a => a.verification_status === 'verified').length;
                 const verificationRate = agenciesData.length > 0 ? (verifiedAgencies / agenciesData.length) * 100 : 0;

                 setStats({
                     users: usersRes.count || 0,
                     agencies: agenciesData.length,
                     bookings: bookingsData.length,
                     listings: vehiclesData.length,
                     revenue: totalRevenue,
                     platformCommission: platformCommission,
                     verificationRate: verificationRate.toFixed(1),
                 });

                 const agenciesWithRevenue = agenciesWithProfiles.map(agency => {
                    const agencyBookings = bookingsWithDetails.filter(b => b.vehicles?.agency_id === agency.id);
                    const revenue = agencyBookings.reduce((sum, b) => sum + b.total_price, 0);
                    return { ...agency, revenue, bookingCount: agencyBookings.length };
                 });
                 agenciesWithRevenue.sort((a,b) => b.revenue - a.revenue);
                 setAgencies(agenciesWithRevenue);

                 const newBookingsActivity = bookingsWithDetails.slice(0, 3).map(b => ({
                     type: 'new_booking',
                     description: t('activityNewBooking', {user: b.profiles?.full_name, make: b.vehicles?.make, model: b.vehicles?.model}),
                     timestamp: b.created_at,
                 }));

                 const newUsersActivity = profilesData.slice(0, 3).map(p => ({
                     type: p.is_agency_owner ? 'new_agency' : 'new_user',
                     description: p.is_agency_owner ? t('activityNewAgency', {name: p.full_name}) : t('activityNewUser', {name: p.full_name}),
                     timestamp: p.created_at,
                 }));

                 const combinedActivity = [...newBookingsActivity, ...newUsersActivity].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                 setRecentActivity(combinedActivity.slice(0, 5));

                 setLoading(false);
            };
            fetchAllData();
        }
    }, [isAdmin, navigate, t]);

    if (loading) return <DashboardLayout title={t('adminDashboardTitle')} description={t('adminDashboardDesc')}><p>{t('loading')}</p></DashboardLayout>;

    const pendingAgencies = agencies.filter(a => a.verification_status === 'pending');

    return (
        <DashboardLayout title={t('adminDashboardTitle')} description={t('adminDashboardDesc')}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Banknote size={32} className="text-green-500 mr-4" /><div><h3 className="text-slate-500">{t('totalRevenue')}</h3><p className="text-3xl font-bold mt-2">{stats.revenue.toLocaleString()} <span className="text-lg font-normal">DZD</span></p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Banknote size={32} className="text-emerald-500 mr-4" /><div><h3 className="text-slate-500">{t('platformCommission')}</h3><p className="text-3xl font-bold mt-2">{stats.platformCommission.toLocaleString()} <span className="text-lg font-normal">DZD</span></p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><FileText size={32} className="text-blue-500 mr-4" /><div><h3 className="text-slate-500">{t('totalBookings')}</h3><p className="text-3xl font-bold mt-2">{stats.bookings}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Users size={32} className="text-indigo-500 mr-4" /><div><h3 className="text-slate-500">{t('totalUsers')}</h3><p className="text-3xl font-bold mt-2">{stats.users}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Building size={32} className="text-sky-500 mr-4" /><div><h3 className="text-slate-500">{t('totalAgencies')}</h3><p className="text-3xl font-bold mt-2">{stats.agencies}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><ShieldCheck size={32} className="text-rose-500 mr-4" /><div><h3 className="text-slate-500">{t('verificationRate')}</h3><p className="text-3xl font-bold mt-2">{stats.verificationRate}%</p></div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">{t('agencyRanking')}</h2>
                     <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50"><tr><th className="p-4 font-semibold">{t('agencyName')}</th><th className="p-4 font-semibold">{t('revenue')}</th><th className="p-4 font-semibold">{t('bookings')}</th><th className="p-4 font-semibold">{t('status')}</th></tr></thead>
                            <tbody>{agencies.slice(0, 10).map(agency => (<tr key={agency.id} className="border-b border-slate-200"><td className="p-4"><Link to={`/admin/agency-details/${agency.id}`} className="text-indigo-600 hover:underline">{agency.agency_name}</Link></td><td className="p-4">{agency.revenue.toLocaleString()} DZD</td><td className="p-4">{agency.bookingCount}</td><td className="p-4">{agency.verification_status === 'verified' ? <span className="flex items-center text-green-600"><ShieldCheck size={16} className="mr-1" /> {t('verified')}</span> : <span className="flex items-center text-yellow-600"><Clock size={16} className="mr-1" /> {t('pending')}</span>}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{t('pendingVerifications')} ({pendingAgencies.length})</h2>
                        {pendingAgencies.length > 0 ? (
                            <div className="bg-white rounded-lg shadow-md overflow-hidden"><ul className="divide-y divide-slate-200">{pendingAgencies.map(agency => (<li key={agency.id} className="p-4 flex justify-between items-center hover:bg-slate-50"><div><p className="font-semibold text-slate-800">{agency.agency_name}</p><p className="text-sm text-slate-500">{t('submittedBy', {name: agency.profiles?.full_name || 'N/A'})}</p></div><Link to={`/admin/agency-details/${agency.id}`} className="flex items-center text-sm bg-indigo-600 text-white px-3 py-1 rounded-md font-semibold hover:bg-indigo-700"><Eye size={16} className="mr-2"/> {t('review')}</Link></li>))}</ul></div>
                        ) : (<p className="text-slate-500 bg-white p-6 rounded-lg shadow-md">{t('noPendingVerifications')}</p>)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{t('recentActivity')}</h2>
                        <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="text-sm text-slate-600 border-b border-slate-100 pb-2">
                                    <p>{activity.description}</p>
                                    <p className="text-xs text-slate-400">{new Date(activity.timestamp).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}