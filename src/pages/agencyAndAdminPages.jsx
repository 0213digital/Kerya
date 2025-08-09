import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { VehicleFormModal, DeleteConfirmationModal, RejectionModal, FileUploadBox } from '../components/modals';
import { algeriaGeoData } from '../data/geoAndCarData';
import { List, Car, Banknote, Plus, Edit, Trash2, RefreshCw, Users, Building, FileText, Eye, ShieldCheck, XCircle, Clock, CheckCircle } from 'lucide-react';

export function AgencyDashboardPage() {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const [stats, setStats] = useState({ listings: 0, activeRentals: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!profile) return;
            setLoading(true);
            const { data: agency, error: agencyError } = await supabase.from('agencies').select('id').eq('owner_id', profile.id).single();
            if (agencyError || !agency) {
                console.error("Error fetching agency for stats:", agencyError);
                setLoading(false);
                return;
            }

            const { data: vehicles, error: vehiclesError } = await supabase.from('vehicles').select('id').eq('agency_id', agency.id);
            if (vehiclesError) {
                setLoading(false);
                return;
            }
            const vehicleIds = vehicles.map(v => v.id);

            const { data: bookings } = await supabase.from('bookings').select('total_price, start_date, end_date').in('vehicle_id', vehicleIds);
            
            let activeRentalsCount = 0;
            let totalRevenue = 0;
            const today = new Date();

            if (bookings) {
                bookings.forEach(b => {
                    totalRevenue += b.total_price;
                    const startDate = new Date(b.start_date);
                    const endDate = new Date(b.end_date);
                    if (today >= startDate && today <= endDate) {
                        activeRentalsCount++;
                    }
                });
            }

            setStats({
                listings: vehicleIds.length,
                activeRentals: activeRentalsCount,
                totalRevenue: totalRevenue,
            });
            setLoading(false);
        };

        fetchStats();
    }, [profile]);

    return (
        <DashboardLayout title={t('agencyDashboardTitle')} description={t('agencyDashboardDesc')}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><List size={32} className="text-indigo-500 mr-4" /><div><h3 className="text-slate-500">{t('totalListings')}</h3><p className="text-3xl font-bold mt-2">{loading ? '...' : stats.listings}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Car size={32} className="text-green-500 mr-4" /><div><h3 className="text-slate-500">{t('activeRentals')}</h3><p className="text-3xl font-bold mt-2">{loading ? '...' : stats.activeRentals}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Banknote size={32} className="text-blue-500 mr-4" /><div><h3 className="text-slate-500">{t('totalRevenue')}</h3><p className="text-3xl font-bold mt-2">{loading ? '...' : stats.totalRevenue.toLocaleString()}</p></div></div>
            </div>
        </DashboardLayout>
    );
}

export function AgencyVehiclesPage() {
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

    useEffect(() => {
        const fetchBookings = async () => {
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
        };
        fetchBookings();
    }, [profile]);

    return (
        <DashboardLayout title={t('agencyBookings')} description={t('agencyBookingsDesc')}>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50"><tr><th className="p-4 font-semibold">{t('customer')}</th><th className="p-4 font-semibold">{t('vehicle')}</th><th className="p-4 font-semibold">{t('dates')}</th><th className="p-4 font-semibold">{t('price')}</th><th className="p-4 font-semibold">{t('status')}</th></tr></thead>
                    <tbody>
                        {loading ? (<tr><td colSpan="5" className="p-4 text-center">{t('loading')}</td></tr>) : bookings.length > 0 ? (
                            bookings.map(b => (
                                <tr key={b.id} className="border-b border-slate-200">
                                    <td className="p-4"><div>{b.profiles.full_name}</div><div className="text-sm text-slate-500">{b.profiles.email}</div></td>
                                    <td className="p-4">{b.vehicles.make} {b.vehicles.model}</td>
                                    <td className="p-4">{new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}</td>
                                    <td className="p-4">{b.total_price.toLocaleString()} DZD</td>
                                    <td className="p-4"><span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 capitalize">{b.status}</span></td>
                                </tr>
                            ))
                        ) : (<tr><td colSpan="5" className="p-4 text-center">No bookings found.</td></tr>)}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}

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
        if (!profile || !formState.trade_register_url || !formState.id_card_url || !formState.selfie_url) { setError("Please upload all required documents."); return; }
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
    
    const [stats, setStats] = useState({ users: 0, agencies: 0, bookings: 0, listings: 0, revenue: 0 });
    const [allAgencies, setAllAgencies] = useState([]);
    const [pendingAgencies, setPendingAgencies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin === false) { navigate('/'); return; }
        if (isAdmin === true) {
            const fetchAllData = async () => {
                 setLoading(true);
                 const [agenciesRes, usersRes, bookingsRes, listingsRes] = await Promise.all([
                     supabase.from('agencies').select('*, profiles(full_name)'),
                     supabase.from('profiles').select('id', { count: 'exact' }),
                     supabase.from('bookings').select('total_price'),
                     supabase.from('vehicles').select('id', { count: 'exact' })
                 ]);

                 const agenciesData = agenciesRes.data || [];
                 setAllAgencies(agenciesData);
                 setPendingAgencies(agenciesData.filter(a => a.verification_status === 'pending'));
                 const bookingsData = bookingsRes.data || [];
                 const totalRevenue = bookingsData.reduce((sum, booking) => sum + booking.total_price, 0);
                 setStats({
                     users: usersRes.count || 0,
                     agencies: agenciesData.length,
                     bookings: bookingsData.length,
                     listings: listingsRes.count || 0,
                     revenue: totalRevenue
                 });
                 setLoading(false);
            };
            fetchAllData();
        }
    }, [isAdmin, navigate]);

    if (loading) return <DashboardLayout title={t('adminDashboardTitle')} description={t('adminDashboardDesc')}><p>{t('loading')}</p></DashboardLayout>;

    return (
        <DashboardLayout title={t('adminDashboardTitle')} description={t('adminDashboardDesc')}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Banknote size={32} className="text-green-500 mr-4" /><div><h3 className="text-slate-500">{t('totalRevenue')}</h3><p className="text-3xl font-bold mt-2">{stats.revenue.toLocaleString()} <span className="text-lg font-normal">DZD</span></p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><FileText size={32} className="text-blue-500 mr-4" /><div><h3 className="text-slate-500">{t('totalBookings')}</h3><p className="text-3xl font-bold mt-2">{stats.bookings}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Users size={32} className="text-indigo-500 mr-4" /><div><h3 className="text-slate-500">{t('totalUsers')}</h3><p className="text-3xl font-bold mt-2">{stats.users}</p></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center"><Car size={32} className="text-orange-500 mr-4" /><div><h3 className="text-slate-500">{t('totalListings')}</h3><p className="text-3xl font-bold mt-2">{stats.listings}</p></div></div>
            </div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Pending Verifications</h2>
                {pendingAgencies.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden"><ul className="divide-y divide-slate-200">{pendingAgencies.map(agency => (<li key={agency.id} className="p-4 flex justify-between items-center hover:bg-slate-50"><div><p className="font-semibold text-slate-800">{agency.agency_name}</p><p className="text-sm text-slate-500">Submitted by: {agency.profiles?.full_name || 'N/A'}</p></div><Link to={`/admin/agency-details/${agency.id}`} className="flex items-center text-sm bg-indigo-600 text-white px-3 py-1 rounded-md font-semibold hover:bg-indigo-700"><Eye size={16} className="mr-2"/> Review</Link></li>))}</ul></div>
                ) : (<p className="text-slate-500 bg-white p-6 rounded-lg shadow-md">No agencies are currently pending verification.</p>)}
            </div>
            <h2 className="text-2xl font-bold mb-4">{t('allAgencies')}</h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50"><tr><th className="p-4 font-semibold">{t('agencyName')}</th><th className="p-4 font-semibold">{t('owner')}</th><th className="p-4 font-semibold">{t('verificationStatus')}</th><th className="p-4 font-semibold">{t('actions')}</th></tr></thead>
                    <tbody>{allAgencies.map(agency => (<tr key={agency.id} className="border-b border-slate-200"><td className="p-4"><Link to={`/admin/agency-details/${agency.id}`} className="text-indigo-600 hover:underline">{agency.agency_name}</Link></td><td className="p-4">{agency.profiles?.full_name || 'N/A'}</td><td className="p-4">{agency.verification_status === 'verified' && <span className="flex items-center text-green-600"><ShieldCheck size={16} className="mr-1" /> {t('verified')}</span>}{agency.verification_status === 'pending' && <span className="flex items-center text-yellow-600"><Clock size={16} className="mr-1" /> {t('pending')}</span>}{agency.verification_status === 'rejected' && <span className="flex items-center text-red-600"><XCircle size={16} className="mr-1" /> {t('rejected')}</span>}</td><td className="p-4"><Link to={`/admin/agency-details/${agency.id}`} className="flex items-center text-sm text-blue-600 hover:underline"><Eye size={16} className="mr-1"/> View Details</Link></td></tr>))}</tbody>
                </table>
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
    if (!agency) return <DashboardLayout title={t('error')} description="Agency not found." />;

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
