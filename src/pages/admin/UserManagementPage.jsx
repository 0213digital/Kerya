import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Users, Search, AlertTriangle, Filter, MoreVertical, Trash2, Ban, CheckCircle, Edit } from 'lucide-react';
import { ConfirmationModal } from '../../components/modals';

export function UserManagementPage() {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fetchError, setFetchError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, user: null, action: null });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        const { data, error } = await supabase.rpc('get_all_users_with_profiles', {});
        if (error) {
            console.error('Error fetching users via RPC:', error);
            setFetchError(t('failedToFetchUserData'));
            setUsers([]);
        } else {
            const sortedUsers = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setUsers(sortedUsers || []);
        }
        setLoading(false);
    }, [t]);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        } else {
            navigate('/');
        }
    }, [isAdmin, navigate, fetchUsers]);

    const handleAction = async () => {
        if (!modalState.user || !modalState.action) return;

        const { user, action } = modalState;

        if (action === 'delete') {
            const { error } = await supabase.functions.invoke('admin-delete-user', {
                body: { userId: user.id },
            });
            if (error) alert(`Error deleting user: ${error.message}`);
        } else if (action === 'suspend' || action === 'activate') {
            const newStatus = action === 'suspend';
            const { error } = await supabase.from('profiles').update({ is_suspended: newStatus }).eq('id', user.id);
            if (error) alert(`Error updating user: ${error.message}`);
        }
        
        setModalState({ isOpen: false, user: null, action: null });
        fetchUsers();
    };

    const openModal = (user, action) => {
        setActiveDropdown(null);
        setModalState({ isOpen: true, user, action });
    };

    const modalContent = useMemo(() => {
        if (!modalState.isOpen) return null;
        switch (modalState.action) {
            case 'delete': return { title: t('deleteConfirmTitle'), text: t('deleteUserConfirmText'), confirmText: t('delete') };
            case 'suspend': return { title: t('suspendConfirmTitle'), text: t('suspendConfirmText'), confirmText: t('suspendUser') };
            case 'activate': return { title: t('activateConfirmTitle'), text: t('activateConfirmText'), confirmText: t('activateUser') };
            default: return null;
        }
    }, [modalState, t]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const searchMatch = !searchTerm ||
                user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' || (statusFilter === 'active' && !user.is_suspended) || (statusFilter === 'suspended' && user.is_suspended);
            const roleMatch = roleFilter === 'all' || (roleFilter === 'renter' && !user.is_agency_owner) || (roleFilter === 'agencyOwner' && user.is_agency_owner);
            return searchMatch && statusMatch && roleMatch;
        });
    }, [users, searchTerm, statusFilter, roleFilter]);

    if (loading) return <DashboardLayout title={t('userManagement')} description={t('userManagementDesc')}><p>{t('loading')}</p></DashboardLayout>;

    return (
        <DashboardLayout title={t('userManagement')} description={t('userManagementDesc')}>
            {modalState.isOpen && modalContent && (
                <ConfirmationModal
                    title={modalContent.title}
                    text={modalContent.text}
                    confirmText={modalContent.confirmText}
                    onConfirm={handleAction}
                    onCancel={() => setModalState({ isOpen: false, user: null, action: null })}
                    isDestructive={modalState.action !== 'activate'}
                />
            )}
            {fetchError && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert"><p className="font-bold">{t('dataFetchError')}</p><p className="text-sm">{fetchError}</p></div>}
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder={t('searchUsersPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md"
                        >
                            <option value="all">{t('allStatuses')}</option>
                            <option value="active">{t('statusActive')}</option>
                            <option value="suspended">{t('statusSuspended')}</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md"
                        >
                            <option value="all">{t('allRoles')}</option>
                            <option value="renter">{t('renter')}</option>
                            <option value="agencyOwner">{t('agencyOwner')}</option>
                        </select>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="bg-slate-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                    <img src={user.avatar_url || `https://placehold.co/40x40/e2e8f0/64748b?text=${user.full_name?.[0] || 'U'}`} alt="avatar" className="h-10 w-10 rounded-full object-cover mr-3" />
                                    <div>
                                        <Link to={`/admin/users/${user.id}`} className="font-medium text-indigo-600 hover:underline">{user.full_name || 'N/A'}</Link>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}><MoreVertical size={20} /></button>
                                    {activeDropdown === user.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
                                            <Link to={`/admin/users/${user.id}`} onClick={() => setActiveDropdown(null)} className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"><Edit size={14} className="mr-2"/>{t('edit')}</Link>
                                            {user.is_suspended ? (
                                                <button onClick={() => openModal(user, 'activate')} className="flex items-center w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-slate-100"><CheckCircle size={14} className="mr-2"/>{t('activateUser')}</button>
                                            ) : (
                                                <button onClick={() => openModal(user, 'suspend')} className="flex items-center w-full text-left px-4 py-2 text-sm text-amber-700 hover:bg-slate-100"><Ban size={14} className="mr-2"/>{t('suspendUser')}</button>
                                            )}
                                            <button onClick={() => openModal(user, 'delete')} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-slate-100"><Trash2 size={14} className="mr-2"/>{t('deleteUser')}</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                                <div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.is_agency_owner ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{user.is_agency_owner ? t('agencyOwner') : t('renter')}</span>
                                    <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${user.is_suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{user.is_suspended ? t('statusSuspended') : t('statusActive')}</span>
                                </div>
                                <span className="text-slate-500">{new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 font-semibold">{t('fullName')}</th>
                                <th className="p-4 font-semibold">{t('email')}</th>
                                <th className="p-4 font-semibold">{t('userRole')}</th>
                                <th className="p-4 font-semibold">{t('status')}</th>
                                <th className="p-4 font-semibold">{t('memberSince')}</th>
                                <th className="p-4 font-semibold text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="p-4 flex items-center">
                                        <img src={user.avatar_url || `https://placehold.co/40x40/e2e8f0/64748b?text=${user.full_name?.[0] || 'U'}`} alt="avatar" className="h-10 w-10 rounded-full object-cover mr-3" />
                                        <Link to={`/admin/users/${user.id}`} className="font-medium text-indigo-600 hover:underline">{user.full_name || 'N/A'}</Link>
                                    </td>
                                    <td className="p-4 text-slate-600">{user.email}</td>
                                    <td className="p-4"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.is_agency_owner ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{user.is_agency_owner ? t('agencyOwner') : t('renter')}</span></td>
                                    <td className="p-4"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.is_suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{user.is_suspended ? t('statusSuspended') : t('statusActive')}</span></td>
                                    <td className="p-4 text-slate-600">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 text-right relative">
                                        <button onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}><MoreVertical size={20} /></button>
                                        {activeDropdown === user.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
                                                <Link to={`/admin/users/${user.id}`} onClick={() => setActiveDropdown(null)} className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"><Edit size={14} className="mr-2"/>{t('edit')}</Link>
                                                {user.is_suspended ? (
                                                    <button onClick={() => openModal(user, 'activate')} className="flex items-center w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-slate-100"><CheckCircle size={14} className="mr-2"/>{t('activateUser')}</button>
                                                ) : (
                                                    <button onClick={() => openModal(user, 'suspend')} className="flex items-center w-full text-left px-4 py-2 text-sm text-amber-700 hover:bg-slate-100"><Ban size={14} className="mr-2"/>{t('suspendUser')}</button>
                                                )}
                                                <button onClick={() => openModal(user, 'delete')} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-slate-100"><Trash2 size={14} className="mr-2"/>{t('deleteUser')}</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && !loading && (
                    <div className="text-center py-10"><AlertTriangle className="mx-auto h-12 w-12 text-slate-400" /><h3 className="mt-2 text-sm font-medium text-slate-900">{t('noUsersFound')}</h3><p className="mt-1 text-sm text-slate-500">{t('tryAdjustingFilters')}</p></div>
                )}
            </div>
        </DashboardLayout>
    );
}