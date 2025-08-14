import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { VehicleFormModal, DeleteConfirmationModal, RejectionModal, FileUploadBox, CancellationModal, ConfirmationModal } from '../components/modals';
import { algeriaGeoData } from '../data/geoAndCarData';
import { List, Car, Banknote, Plus, Edit, Trash2, RefreshCw, Users, Building, FileText, Eye, ShieldCheck, XCircle, Clock, CheckCircle, Star, BarChart2, Ban, Check, Undo } from 'lucide-react';

// ... (Le composant AgencyDashboardPage reste inchangé)
const MonthlyRevenueChart = ({ data, t }) => {
    const maxValue = Math.max(...data.map(d => d.revenue), 1);
    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h3 className="text-lg font-semibold mb-4">{t('monthlyRevenue')}</h3>
            <div className="flex justify-around items-end h-64 space-x-2">
                {data.map((monthData) => (
                    <div key={monthData.month} className="flex flex-col items-center flex-1 h-full">
                        <div className="w-full h-full flex items-end">
                             <div 
                                className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all rounded-t-md"
                                style={{ height: `${(monthData.revenue / maxValue) * 100}%` }}
                                title={`${t('revenue')}: ${monthData.revenue.toLocaleString()} DZD`}
                            ></div>
                        </div>
                        <span className="text-xs mt-2 text-slate-500">{monthData.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export function AgencyDashboardPage() {
    const { t } = useTranslation();
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
                    month: d.toLocaleString(t('locale'), { month: 'short' })
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
    }, [profile]);
    
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

export function AgencyVehiclesPage() {
    // ... (This component remains unchanged)
    const { t } = useTranslation();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [agency, setAgency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [vehicleToEdit, setVehicleToEdit] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const fetchAgencyAndVehicles = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        const { data: agencyData, error: agencyError } = await supabase.from('agencies').select('*').eq('owner_id', profile.id).single();
        if (agencyError) {
            navigate('/dashboard/agency/onboarding');
            return;
        }
        setAgency(agencyData);
        if (agencyData.verification_status === 'verified') {
            const { data: vehiclesData } = await supabase.from('vehicles').select('*').eq('agency_id', agencyData.id);
            setVehicles(vehiclesData || []);
        }
        setLoading(false);
    }, [profile, navigate]);

    useEffect(() => { fetchAgencyAndVehicles(); }, [fetchAgencyAndVehicles]);

    const handleDelete = async (vehicleId) => {
        await supabase.from('vehicles').delete().eq('id', vehicleId);
        fetchAgencyAndVehicles();
        setShowDeleteConfirm(null);
    };

    const handleEdit = (vehicle) => { setVehicleToEdit(vehicle); setShowForm(true); };
    const handleAdd = () => { setVehicleToEdit(null); setShowForm(true); };

    if (loading) return <DashboardLayout title={t('myVehiclesTitle')} description={t('myVehiclesDesc')}><p>{t('loading')}</p></DashboardLayout>;
    if (agency?.verification_status === 'pending') return <DashboardLayout title={t('myVehiclesTitle')} description={t('myVehiclesDesc')}><div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md"><p className="font-bold">{t('agencyPendingVerification')}</p><p>{t('agencyPendingVerificationDesc')}</p></div></DashboardLayout>;
    if (agency?.verification_status === 'rejected') return <DashboardLayout title={t('myVehiclesTitle')} description={t('myVehiclesDesc')}><div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"><p className="font-bold">{t('agencyRejected')}</p><p><span className="font-semibold">{t('rejectionReason')}</span> {agency.rejection_reason}</p><button onClick={() => navigate('/dashboard/agency/onboarding')} className="mt-4 flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700"><RefreshCw size={16} className="mr-2" /> {t('reapply')}</button></div></DashboardLayout>;

    return (
        <DashboardLayout title={t('myVehiclesTitle')} description={t('myVehiclesDesc')}>
            <div className="flex justify-end mb-4"><button onClick={handleAdd} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700"><Plus size={16} className="mr-2" /> {t('listNewVehicle')}</button></div>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50"><tr><th className="p-4 font-semibold">{t('vehicle')}</th><th className="p-4 font-semibold">{t('dailyRate')}</th><th className="p-4 font-semibold">{t('status')}</th><th className="p-4 font-semibold">{t('actions')}</th></tr></thead>
                    <tbody>
                        {vehicles.map(v => (<tr key={v.id} className="border-b border-slate-200">
                            <td className="p-4">{v.make} {v.model}</td><td className="p-4">{v.daily_rate_dzd} DZD</td>
                            <td className="p-4"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${v.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{v.is_available ? t('available') : t('rentedOut')}</span></td>
                            <td className="p-4 flex space-x-2"><button onClick={() => handleEdit(v)} className="p-2 text-slate-500 hover:text-indigo-600"><Edit size={16} /></button><button onClick={() => setShowDeleteConfirm(v)} className="p-2 text-slate-500 hover:text-red-600"><Trash2 size={16} /></button></td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
            {showForm && <VehicleFormModal vehicleToEdit={vehicleToEdit} agencyId={agency?.id} onClose={() => setShowForm(false)} onSave={fetchAgencyAndVehicles} />}
            {showDeleteConfirm && <DeleteConfirmationModal item={showDeleteConfirm} onCancel={() => setShowDeleteConfirm(null)} onConfirm={() => handleDelete(showDeleteConfirm.id)} />}
        </DashboardLayout>
    );
}

export function AgencyBookingsPage() {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(null);
    const [processing, setProcessing] = useState(false);

    const fetchBookings = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        const { data: agencyData } = await supabase.from('agencies').select('id').eq('owner_id', profile.id).single();
        if (!agencyData) { setLoading(false); return; }
        const { data: vehicleData } = await supabase.from('vehicles').select('id').eq('agency_id', agencyData.id);
        if (!vehicleData || vehicleData.length === 0) { setLoading(false); return; }
        const vehicleIds = vehicleData.map(v => v.id);
        const { data } = await supabase.from('bookings').select('*, vehicles(make, model), profiles(*)').in('vehicle_id', vehicleIds).order('start_date', { ascending: false });
        setBookings(data || []);
        setLoading(false);
    }, [profile]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleStatusUpdate = async (bookingId, newStatus) => {
        setProcessing(true);
        const { error } = await supabase.rpc('update_booking_status_by_agency', {
            p_booking_id: bookingId,
            p_new_status: newStatus,
        });
        if (error) {
            alert(t('error') + ': ' + error.message);
        } else {
            setShowConfirmModal(null);
            fetchBookings();
        }
        setProcessing(false);
    };

    const handleCancelBooking = async (reason) => {
        if (!showCancelModal || !reason.trim()) return;
        setProcessing(true);
        const { error } = await supabase.rpc('cancel_booking_by_agency', {
            p_booking_id: showCancelModal.id,
            p_reason: reason,
        });
        if (error) {
            alert(t('error') + ': ' + error.message);
        } else {
            setShowCancelModal(null);
            fetchBookings();
        }
        setProcessing(false);
    };

    const StatusBadge = ({ status }) => {
        const statusMap = {
            confirmed: { text: t('statusActive'), color: 'green' },
            cancelled: { text: t('statusCancelled'), color: 'red' },
            'picked-up': { text: t('statusPickedUp'), color: 'blue' },
            returned: { text: t('statusReturned'), color: 'slate' },
        };
        const currentStatus = statusMap[status] || { text: status, color: 'slate' };
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-${currentStatus.color}-100 text-${currentStatus.color}-800 capitalize`}>
                {currentStatus.text}
            </span>
        );
    };

    const today = new Date().setHours(0, 0, 0, 0);

    return (
        <DashboardLayout title={t('agencyBookings')} description={t('agencyBookingsDesc')}>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-4 font-semibold">{t('customer')}</th>
                            <th className="p-4 font-semibold">{t('vehicle')}</th>
                            <th className="p-4 font-semibold">{t('dates')}</th>
                            <th className="p-4 font-semibold">{t('price')}</th>
                            <th className="p-4 font-semibold">{t('status')}</th>
                            <th className="p-4 font-semibold text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (<tr><td colSpan="6" className="p-4 text-center">{t('loading')}</td></tr>) : bookings.length > 0 ? (
                            bookings.map(b => {
                                const bookingStartDate = new Date(b.start_date).setHours(0, 0, 0, 0);
                                const bookingEndDate = new Date(b.end_date).setHours(0, 0, 0, 0);
                                return (
                                <tr key={b.id} className="border-b border-slate-200">
                                    <td className="p-4"><div>{b.profiles.full_name}</div><div className="text-sm text-slate-500">{b.profiles.email}</div></td>
                                    <td className="p-4">{b.vehicles.make} {b.vehicles.model}</td>
                                    <td className="p-4">{new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}</td>
                                    <td className="p-4">{b.total_price.toLocaleString()} DZD</td>
                                    <td className="p-4"><StatusBadge status={b.status} /></td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center space-x-2">
                                            {b.status === 'confirmed' && today >= bookingStartDate && (
                                                <button onClick={() => setShowConfirmModal({ booking: b, status: 'picked-up' })} className="text-blue-600 hover:text-blue-800 font-semibold flex items-center text-sm"><Check size={14} className="mr-1"/>{t('markAsPickedUp')}</button>
                                            )}
                                            {b.status === 'picked-up' && today >= bookingEndDate && (
                                                 <button onClick={() => setShowConfirmModal({ booking: b, status: 'returned' })} className="text-slate-600 hover:text-slate-800 font-semibold flex items-center text-sm"><Undo size={14} className="mr-1"/>{t('markAsReturned')}</button>
                                            )}
                                            {b.status === 'confirmed' && (
                                                <button onClick={() => setShowCancelModal(b)} className="text-red-600 hover:text-red-800 font-semibold flex items-center text-sm"><Ban size={14} className="mr-1"/>{t('cancel')}</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})
                        ) : (<tr><td colSpan="6" className="p-4 text-center">{t('noBookingsFoundForAgency')}</td></tr>)}
                    </tbody>
                </table>
            </div>
            {showCancelModal && (
                <CancellationModal
                    booking={showCancelModal}
                    onClose={() => setShowCancelModal(null)}
                    onConfirm={handleCancelBooking}
                    processing={processing}
                />
            )}
            {showConfirmModal && (
                 <ConfirmationModal
                    title={showConfirmModal.status === 'picked-up' ? t('confirmPickupTitle') : t('confirmReturnTitle')}
                    text={showConfirmModal.status === 'picked-up' ? t('confirmPickupText') : t('confirmReturnText')}
                    confirmText={showConfirmModal.status === 'picked-up' ? t('markAsPickedUp') : t('markAsReturned')}
                    onConfirm={() => handleStatusUpdate(showConfirmModal.booking.id, showConfirmModal.status)}
                    onCancel={() => setShowConfirmModal(null)}
                />
            )}
        </DashboardLayout>
    );
}

// ... (Le reste du fichier reste inchangé)
export function AgencyOnboardingPage() {
    const { t } = useTranslation();
    const { profile } = useAuth();
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
            if (!profile) return;
            const { data } = await supabase.from('agencies').select('*').eq('owner_id', profile.id).single();
            if (data) {
                setFormState(data);
                setIsReapplying(true);
                if (data.wilaya) setCities(algeriaGeoData[data.wilaya] || []);
            }
        };
        checkForExistingAgency();
    }, [profile]);

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
                    <FileUploadBox type="trade_register" label={t('tradeRegisterUpload')} url={formState.trade_register_url} uploading={uploading.trade_register} onChange={handleFileUpload} />
                    <FileUploadBox type="id_card" label={t('idCardUpload')} url={formState.id_card_url} uploading={uploading.id_card} onChange={handleFileUpload} />
                    <FileUploadBox type="selfie" label={t('selfieUpload')} url={formState.selfie_url} uploading={uploading.selfie} onChange={handleFileUpload} />
                    <button type="submit" disabled={loading || Object.values(uploading).some(u => u)} className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">{loading ? t('loading') : (isReapplying ? t('updateAgencyButton') : t('createAgencyButton'))}</button>
                </form>
            </div>
        </DashboardLayout>
    );
}
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
                     supabase.from('agencies').select('*, profiles(full_name, created_at)'),
                     supabase.from('profiles').select('id', { count: 'exact' }),
                     supabase.from('bookings').select('*, vehicles(make, model, agency_id), profiles(full_name)'),
                     supabase.from('vehicles').select('id', { count: 'exact' }),
                     supabase.from('profiles').select('full_name, created_at, is_agency_owner').order('created_at', { ascending: false }).limit(5)
                 ]);

                 const agenciesData = agenciesRes.data || [];
                 const bookingsData = bookingsRes.data || [];
                 
                 const totalRevenue = bookingsData.reduce((sum, booking) => sum + booking.total_price, 0);
                 const platformCommission = totalRevenue * 0.10;
                 const verifiedAgencies = agenciesData.filter(a => a.verification_status === 'verified').length;
                 const verificationRate = agenciesData.length > 0 ? (verifiedAgencies / agenciesData.length) * 100 : 0;
                 
                 setStats({
                     users: usersRes.count || 0,
                     agencies: agenciesData.length,
                     bookings: bookingsData.length,
                     listings: listingsRes.count || 0,
                     revenue: totalRevenue,
                     platformCommission: platformCommission,
                     verificationRate: verificationRate.toFixed(1),
                 });
                 
                 const agenciesWithRevenue = agenciesData.map(agency => {
                    const agencyBookings = bookingsData.filter(b => b.vehicles?.agency_id === agency.id);
                    const revenue = agencyBookings.reduce((sum, b) => sum + b.total_price, 0);
                    return { ...agency, revenue, bookingCount: agencyBookings.length };
                 });
                 agenciesWithRevenue.sort((a,b) => b.revenue - a.revenue);
                 setAgencies(agenciesWithRevenue);

                 const newBookingsActivity = bookingsData.slice(0, 3).map(b => ({
                     type: 'new_booking',
                     description: t('activityNewBooking', {user: b.profiles?.full_name, make: b.vehicles?.make, model: b.vehicles?.model}),
                     timestamp: b.created_at,
                 }));

                 const newUsersActivity = (profilesRes.data || []).slice(0, 3).map(p => ({
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
export function AdminAgencyDetailsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const [agency, setAgency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);

    useEffect(() => {
        const fetchAgencyDetails = async () => {
            if (!id) return;
            setLoading(true);
            const { data } = await supabase.from('agencies').select('*, profiles(full_name)').eq('id', id).single();
            setAgency(data);
            setLoading(false);
        };
        fetchAgencyDetails();
    }, [id]);

    const handleApprove = async () => {
        setProcessing(true);
        await supabase.from('agencies').update({ verification_status: 'verified', rejection_reason: null }).eq('id', id);
        navigate('/admin/dashboard');
        setProcessing(false);
    };

    const handleReject = async (reason) => {
        setProcessing(true);
        await supabase.from('agencies').update({ verification_status: 'rejected', rejection_reason: reason }).eq('id', id);
        setShowRejectionModal(false);
        navigate('/admin/dashboard');
        setProcessing(false);
    };

    if (loading) return <DashboardLayout title={t('agencyDetails')} description=""><p>{t('loading')}</p></DashboardLayout>;
    if (!agency) return <DashboardLayout title={t('error')} description={t('agencyNotFound')} />;

    return (
        <DashboardLayout title={t('agencyDetails')} description={agency.agency_name}>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><h3 className="font-semibold">{t('agencyName')}:</h3><p>{agency.agency_name}</p></div>
                    <div><h3 className="font-semibold">{t('owner')}:</h3><p>{agency.profiles?.full_name}</p></div>
                    <div><h3 className="font-semibold">{t('address')}:</h3><p>{`${agency.address}, ${agency.city}, ${agency.wilaya}`}</p></div>
                    <div><h3 className="font-semibold">{t('tradeRegister')}:</h3><p>{agency.trade_register_number}</p></div>
                    <div><h3 className="font-semibold">{t('verificationStatus')}:</h3><p className="capitalize">{agency.verification_status}</p></div>
                </div>
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-xl font-bold mb-4">{t('verificationDocuments')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">{t('tradeRegisterUpload')}</h4>
                            <a href={agency.trade_register_url} target="_blank" rel="noopener noreferrer">
                                <img src={agency.trade_register_url} alt="Trade Register" className="w-full h-auto object-cover rounded-md border-2 border-slate-200 hover:border-indigo-500 transition" />
                            </a>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">{t('idCardUpload')}</h4>
                             <a href={agency.id_card_url} target="_blank" rel="noopener noreferrer">
                                <img src={agency.id_card_url} alt="ID Card" className="w-full h-auto object-cover rounded-md border-2 border-slate-200 hover:border-indigo-500 transition" />
                            </a>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">{t('selfieUpload')}</h4>
                            <a href={agency.selfie_url} target="_blank" rel="noopener noreferrer">
                                <img src={agency.selfie_url} alt="Selfie" className="w-full h-auto object-cover rounded-md border-2 border-slate-200 hover:border-indigo-500 transition" />
                            </a>
                        </div>
                    </div>
                </div>
                {agency.verification_status === 'pending' && (
                    <div className="mt-6 border-t pt-6 flex space-x-4">
                        <button onClick={handleApprove} disabled={processing} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 disabled:bg-green-400"><CheckCircle size={16} className="mr-2" /> {processing ? t('processing') : t('approve')}</button>
                        <button onClick={() => setShowRejectionModal(true)} disabled={processing} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700 disabled:bg-red-400"><XCircle size={16} className="mr-2" /> {t('reject')}</button>
                    </div>
                )}
            </div>
            {showRejectionModal && <RejectionModal onCancel={() => setShowRejectionModal(false)} onSubmit={handleReject} processing={processing} />}
        </DashboardLayout>
    );
}
