import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LocationManagementPage() {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null); // { type: 'wilaya'/'city', data: {} }

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        const { data: wilayas, error: wilayasError } = await supabase.from('wilayas').select('id, name').order('name');
        const { data: cities, error: citiesError } = await supabase.from('cities').select('id, name, wilaya_id').order('name');

        if (wilayasError || citiesError) {
            console.error(wilayasError || citiesError);
        } else {
            const groupedLocations = wilayas.map(wilaya => ({
                ...wilaya,
                cities: cities.filter(city => city.wilaya_id === wilaya.id)
            }));
            setLocations(groupedLocations);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
        } else {
            fetchLocations();
        }
    }, [isAdmin, navigate, fetchLocations]);

    const handleSave = async (e) => {
        e.preventDefault();
        const { type, data } = isEditing;
        let error;

        if (type === 'wilaya') {
            const { id, name } = data;
            if (id) { // Update
                ({ error } = await supabase.from('wilayas').update({ name }).eq('id', id));
            } else { // Insert
                ({ error } = await supabase.from('wilayas').insert({ name }));
            }
        } else if (type === 'city') {
            const { id, name, wilaya_id } = data;
            if (id) { // Update
                ({ error } = await supabase.from('cities').update({ name }).eq('id', id));
            } else { // Insert
                ({ error } = await supabase.from('cities').insert({ name, wilaya_id }));
            }
        }

        if (error) alert(error.message);
        else {
            setIsEditing(null);
            fetchLocations();
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(t('deleteConfirmText'))) return;
        const table = type === 'wilaya' ? 'wilayas' : 'cities';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) alert(error.message);
        else fetchLocations();
    };

    const EditModal = () => (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSave} className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-xl font-bold">{isEditing.data.id ? t('edit') : t('add')} {isEditing.type}</h3>
                <input
                    type="text"
                    value={isEditing.data.name}
                    onChange={(e) => setIsEditing(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                    className="w-full p-2 border border-slate-300 rounded-md"
                    required
                />
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setIsEditing(null)} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-100 hover:bg-slate-200">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">{t('saveChanges')}</button>
                </div>
            </form>
        </div>
    );

    return (
        <DashboardLayout title={t('locationManagement')} description={t('locationManagementDesc')}>
            {isEditing && <EditModal />}
            <div className="flex justify-end mb-4">
                <button onClick={() => setIsEditing({ type: 'wilaya', data: { name: '' } })} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700">
                    <Plus size={16} className="mr-2" /> {t('addWilaya')}
                </button>
            </div>
            {loading ? <p>{t('loading')}</p> : (
                <div className="space-y-4">
                    {locations.map(wilaya => (
                        <div key={wilaya.id} className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center border-b pb-2 mb-2">
                                <h3 className="text-lg font-bold flex items-center"><MapPin size={18} className="mr-2" /> {wilaya.name}</h3>
                                <div className="space-x-2">
                                    <button onClick={() => setIsEditing({ type: 'wilaya', data: wilaya })} className="p-1 text-slate-500 hover:text-indigo-600"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete('wilaya', wilaya.id)} className="p-1 text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="pl-6">
                                {wilaya.cities.map(city => (
                                    <div key={city.id} className="flex justify-between items-center py-1">
                                        <span>- {city.name}</span>
                                        <div className="space-x-2">
                                            <button onClick={() => setIsEditing({ type: 'city', data: city })} className="p-1 text-slate-500 hover:text-indigo-600"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete('city', city.id)} className="p-1 text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setIsEditing({ type: 'city', data: { name: '', wilaya_id: wilaya.id } })} className="text-sm text-indigo-600 hover:underline mt-2 flex items-center">
                                    <Plus size={14} className="mr-1" /> {t('addCity')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}