import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ConfirmationModal } from '../../components/modals';
import { User, Mail, Phone, Calendar, Shield, Ban, CheckCircle } from 'lucide-react';

export function UserDetailsPage() {
    const { t } = useTranslation();
    const { id: userId } = useParams();
    const { isAdmin, profile } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (profile === null) return;
        if (!isAdmin) {
            navigate('/');
        }
    }, [profile, isAdmin, navigate]);

    const fetchUserData = useCallback(async () => {
        if (!isAdmin || !userId) return;
        setLoading(true);

        const [usersRes, bookingsRes] = await Promise.all([
            supabase.rpc('get_all_users_with_profiles'),
            supabase.from('bookings').select('*, vehicles(make, model)').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        const { data: usersData, error: usersError } = usersRes;
        const { data: bookingsData, error: bookingsError } = bookingsRes;

        if (usersError) {
            console.error('Error fetching user data:', usersError);
            setUser(null);
        } else {
            const currentUser = usersData?.find(u => u.id === userId);
            setUser(currentUser || null);
        }

        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            setBookings([]);
        } else {
            setBookings(bookingsData || []);
        }

        setLoading(false);
    }, [userId, isAdmin]);

    useEffect(() => {
        if (profile && isAdmin) {
            fetchUserData();
        }
    }, [fetchUserData, profile, isAdmin]);

    const handleToggleSuspend = async () => {
        if (!user) return;
        const newStatus = !user.is_suspended;
        const { error } = await supabase
            .from('profiles')
            .update({ is_suspended: newStatus })
            .eq('id', user.id);

        if (error) {
            alert('Error updating user status.');
            console.error(error);
        } else {
            fetchUserData();
        }
        setShowConfirmModal(false);
    };

    if (!isAdmin) {
        return <DashboardLayout title={t('loading')} description="..." />;
    }

    if (loading) return <DashboardLayout title={t('loading')} description="..." />;
    if (!user) return <DashboardLayout title={t('error')} description="User not found." />;

    const isSuspended = user.is_suspended;

    return (
        <DashboardLayout title={t('userDetails')} description={user.full_name}>
            {showConfirmModal && (
                <ConfirmationModal
                    title={isSuspended ? t('activateConfirmTitle') : t('suspendConfirmTitle')}
                    text={isSuspended ? t('activateConfirmText') : t('suspendConfirmText')}
                    confirmText={isSuspended ? t('activateUser') : t('suspendUser')}
                    onConfirm={handleToggleSuspend}
                    onCancel={() => setShowConfirmModal(false)}
                    isDestructive={!isSuspended}
                />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex flex-col items-center text-center">
                            <img src={user.avatar_url || `https://placehold.co/128x128/e2e8f0/64748b?text=${user.full_name?.[0] || 'U'}`} alt="avatar" className="h-32 w-32 rounded-full object-cover mb-4 border-4 border-slate-200" />
                            <h2 className="text-2xl font-bold">{user.full_name}</h2>
                            <span className={`mt-2 px-3 py-1 text-sm font-semibold rounded-full ${user.is_agency_owner ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                {user.is_agency_owner ? t('agencyOwner') : t('renter')}
                            </span>
                        </div>
                        <div className="mt-6 border-t border-slate-200 pt-6 space-y-4 text-sm">
                            <div className="flex items-center"><Mail size={16} className="mr-3 text-slate-400" /><span className="text-slate-600">{user.email || 'Not available'}</span></div>
                            <div className="flex items-center"><Phone size={16} className="mr-3 text-slate-400" /><span className="text-slate-600">{user.phone_number ? `+213 ${user.phone_number}` : 'Not provided'}</span></div>
                            <div className="flex items-center"><Calendar size={16} className="mr-3 text-slate-400" /><span className="text-slate-600">{t('memberSince')}: {new Date(user.created_at).toLocaleDateString()}</span></div>
                             <div className="flex items-center">
                                <Shield size={16} className="mr-3 text-slate-400" />
                                <span className={`font-medium ${isSuspended ? 'text-red-600' : 'text-green-600'}`}>
                                    {isSuspended ? t('statusSuspended') : t('statusActive')}
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 border-t border-slate-200 pt-6">
                            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">{t('actions')}</h3>
                            <button
                                onClick={() => setShowConfirmModal(true)}
                                className={`w-full flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md ${isSuspended ? 'border-green-300 text-green-700 bg-white hover:bg-green-50' : 'border-red-300 text-red-700 bg-white hover:bg-red-50'}`}
                            >
                                {isSuspended ? <CheckCircle size={16} className="mr-2" /> : <Ban size={16} className="mr-2" />}
                                {isSuspended ? t('activateUser') : t('suspendUser')}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">{t('bookingHistory')} ({bookings.length})</h3>
                        {bookings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="p-3 font-semibold">{t('vehicle')}</th>
                                            <th className="p-3 font-semibold">{t('dates')}</th>
                                            <th className="p-3 font-semibold text-right">{t('price')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map(booking => (
                                            <tr key={booking.id} className="border-b border-slate-200">
                                                <td className="p-3">{booking.vehicles?.make || 'N/A'} {booking.vehicles?.model || ''}</td>
                                                <td className="p-3">{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</td>
                                                <td className="p-3 text-right font-medium">{booking.total_price.toLocaleString()} {t('dailyRateSuffix').split('/')[0]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-slate-500">{t('noBookingsFound')}</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
