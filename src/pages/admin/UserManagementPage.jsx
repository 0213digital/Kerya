import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from '../../contexts/LanguageContext';
import { AppContext } from '../../contexts/AppContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Users, Search, AlertTriangle, Filter } from 'lucide-react';

export function UserManagementPage() {
    const { t } = useTranslation();
    const { profile } = useContext(AppContext);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fetchError, setFetchError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'suspended'
    const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'renter', 'agencyOwner'


    const isAdmin = profile?.id === '08116ec7-be3f-43fb-a7c8-c1e76c9540de';

    useEffect(() => {
        if (profile === null) return;
        if (!isAdmin) {
            navigate('/');
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            setFetchError(null);

            const { data, error } = await supabase.rpc('get_all_users_with_profiles');

            if (error) {
                console.error('Error fetching users via RPC:', error);
                setFetchError('Failed to fetch user data. Please check the `get_all_users_with_profiles` function in your Supabase SQL Editor.');
                setUsers([]);
            } else {
                data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setUsers(data || []);
            }
            setLoading(false);
        };

        fetchUsers();
    }, [profile, isAdmin, navigate]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const searchMatch = !searchTerm ||
                user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const statusMatch = statusFilter === 'all' ||
                (statusFilter === 'active' && !user.is_suspended) ||
                (statusFilter === 'suspended' && user.is_suspended);

            const roleMatch = roleFilter === 'all' ||
                (roleFilter === 'renter' && !user.is_agency_owner) ||
                (roleFilter === 'agencyOwner' && user.is_agency_owner);

            return searchMatch && statusMatch && roleMatch;
        });
    }, [users, searchTerm, statusFilter, roleFilter]);


    if (loading) {
        return <DashboardLayout title={t('userManagement')} description={t('userManagementDesc')}><p>{t('loading')}</p></DashboardLayout>;
    }

    return (
        <DashboardLayout title={t('userManagement')} description={t('userManagementDesc')}>
            {fetchError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
                    <p className="font-bold">Data Fetch Error</p>
                    <p className="text-sm">{fetchError}</p>
                </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder={t('searchUsersPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                         <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm"
                        >
                            <option value="all">{t('allStatuses')}</option>
                            <option value="active">{t('statusActive')}</option>
                            <option value="suspended">{t('statusSuspended')}</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm"
                        >
                            <option value="all">{t('allRoles')}</option>
                            <option value="renter">{t('renter')}</option>
                            <option value="agencyOwner">{t('agencyOwner')}</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 font-semibold">{t('fullName')}</th>
                                <th className="p-4 font-semibold">{t('email')}</th>
                                <th className="p-4 font-semibold">{t('userRole')}</th>
                                <th className="p-4 font-semibold">{t('status')}</th>
                                <th className="p-4 font-semibold">{t('memberSince')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="p-4 flex items-center">
                                        <img src={user.avatar_url || `https://placehold.co/40x40/e2e8f0/64748b?text=${user.full_name?.[0] || 'U'}`} alt="avatar" className="h-10 w-10 rounded-full object-cover mr-3" />
                                        <Link to={`/admin/users/${user.id}`} className="font-medium text-indigo-600 hover:underline">
                                            {user.full_name || 'N/A'}
                                        </Link>
                                    </td>
                                    <td className="p-4 text-slate-600">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.is_agency_owner ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.is_agency_owner ? t('agencyOwner') : t('renter')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.is_suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.is_suspended ? t('statusSuspended') : t('statusActive')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">{new Date(user.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && !loading && (
                    <div className="text-center py-10">
                        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">{t('noUsersFound')}</h3>
                        <p className="mt-1 text-sm text-slate-500">{t('tryAdjustingFilters')}</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}