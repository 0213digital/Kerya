import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ConfirmationModal, EditUserModal } from '../../components/modals';
import { User, Mail, Phone, Calendar, Shield, Ban, CheckCircle, Edit, KeyRound, Trash2 } from 'lucide-react';

export function UserDetailsPage() {
    const { t } = useTranslation();
    const { id: userId } = useParams();
    const { isAdmin, profile } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ type: null, user: null }); // Single state for all modals

    const fetchUserData = useCallback(async () => {
        if (!isAdmin || !userId) return;
        setLoading(true);
        const [usersRes, bookingsRes] = await Promise.all([
            supabase.rpc('get_all_users_with_profiles'),
            supabase.from('bookings').select('*, vehicles(make, model)').eq('user_id', userId).order('created_at', { ascending: false })
        ]);
        const { data: usersData, error: usersError } = usersRes;
        const { data: bookingsData, error: bookingsError } = bookingsRes;
        if (usersError) setUser(null);
        else setUser(usersData?.find(u => u.id === userId) || null);
        if (bookingsError) setBookings([]);
        else setBookings(bookingsData || []);
        setLoading(false);
    }, [userId, isAdmin]);

    useEffect(() => {
        if (profile && isAdmin) fetchUserData();
        else if (profile && !isAdmin) navigate('/');
    }, [fetchUserData, profile, isAdmin, navigate]);
    
    const handleAction = async (actionType, payload) => {
        if (!user) return;
        let error;

        switch(actionType) {
            case 'toggleSuspend':
                const { error: suspendError } = await supabase.from('profiles').update({ is_suspended: !user.is_suspended }).eq('id', user.id);
                error = suspendError;
                break;
            case 'sendReset':
                const { error: resetError } = await supabase.functions.invoke('admin-reset-password', { body: { email: user.email } });
                if (!resetError) alert(t('passwordResetSent'));
                error = resetError;
                break;
            case 'deleteUser':
                const { error: deleteError } = await supabase.functions.invoke('admin-delete-user', { body: { userId: user.id } });
                if (!deleteError) navigate('/admin/users');
                error = deleteError;
                break;
            case 'updateProfile':
                const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', user.id);
                error = updateError;
                break;
            default:
                break;
        }

        if (error) alert(`Error: ${error.message}`);
        setModal({ type: null, user: null });
        fetchUserData();
    };

    if (loading) return <DashboardLayout title={t('loading')} description="..." />;
    if (!user) return <DashboardLayout title={t('error')} description="User not found." />;

    const isSuspended = user.is_suspended;

    return (
        <DashboardLayout title={t('userDetails')} description={user.full_name}>
            {modal.type === 'edit' && <EditUserModal user={modal.user} onSave={(data) => handleAction('updateProfile', data)} onClose={() => setModal({ type: null, user: null })} />}
            {modal.type === 'confirm' && (
                <ConfirmationModal
                    title={modal.title} text={modal.text} confirmText={modal.confirmText}
                    onConfirm={() => handleAction(modal.action)}
                    onCancel={() => setModal({ type: null, user: null })}
                    isDestructive={modal.isDestructive}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {/* User Info Display (same as before) */}
                        <div className="mt-6 border-t border-slate-200 pt-6">
                            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">{t('actions')}</h3>
                            <div className="space-y-2">
                                <button onClick={() => setModal({ type: 'edit', user })} className="w-full flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md border-slate-300 text-slate-700 bg-white hover:bg-slate-50"><Edit size={16} className="mr-2" />{t('editProfile')}</button>
                                <button onClick={() => handleAction('sendReset')} className="w-full flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md border-slate-300 text-slate-700 bg-white hover:bg-slate-50"><KeyRound size={16} className="mr-2" />{t('sendPasswordReset')}</button>
                                <button onClick={() => setModal({ type: 'confirm', action: 'toggleSuspend', title: isSuspended ? t('activateConfirmTitle') : t('suspendConfirmTitle'), text: isSuspended ? t('activateConfirmText') : t('suspendConfirmText'), confirmText: isSuspended ? t('activateUser') : t('suspendUser'), isDestructive: !isSuspended })} className={`w-full flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md ${isSuspended ? 'border-green-300 text-green-700 bg-white hover:bg-green-50' : 'border-amber-300 text-amber-700 bg-white hover:bg-amber-50'}`}>
                                    {isSuspended ? <CheckCircle size={16} className="mr-2" /> : <Ban size={16} className="mr-2" />}
                                    {isSuspended ? t('activateUser') : t('suspendUser')}
                                </button>
                                <button onClick={() => setModal({ type: 'confirm', action: 'deleteUser', title: t('deleteConfirmTitle'), text: t('deleteUserConfirmText'), confirmText: t('deleteUser'), isDestructive: true })} className="w-full flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md border-red-300 text-red-700 bg-white hover:bg-red-50"><Trash2 size={16} className="mr-2" />{t('deleteUser')}</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    {/* Booking History (same as before) */}
                </div>
            </div>
        </DashboardLayout>
    );
}