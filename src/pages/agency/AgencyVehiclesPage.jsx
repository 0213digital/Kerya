import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { VehicleFormModal, DeleteConfirmationModal } from '../../components/modals';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';

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
            <div className="flex justify-end mb-4">
                <button onClick={handleAdd} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700">
                    <Plus size={16} className="mr-2" /> {t('listNewVehicle')}
                </button>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
                {vehicles.map(v => (
                    <div key={v.id} className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-800">{v.make} {v.model}</p>
                                <p className="text-sm text-slate-500">{v.daily_rate_dzd.toLocaleString()} DZD</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${v.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {v.is_available ? t('available') : t('rentedOut')}
                            </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end space-x-2">
                            <button onClick={() => handleEdit(v)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100"><Edit size={18} /></button>
                            <button onClick={() => setShowDeleteConfirm(v)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-md overflow-x-auto">
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