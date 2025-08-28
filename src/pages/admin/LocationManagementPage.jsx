import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ConfirmationModal } from '../../components/modals';
import { toast } from 'react-hot-toast';
import { ToggleLeft, ToggleRight, MapPin, Search, AlertTriangle, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { algeriaGeoData } from '../../data/geoAndCarData';

export function LocationManagementPage() {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    const [dbWilayas, setDbWilayas] = useState(new Map());
    const [dbCities, setDbCities] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null); // State to track the item being processed
    const [modal, setModal] = useState({ isOpen: false, data: null });

    const allWilayas = useMemo(() => Object.keys(algeriaGeoData).sort(), []);

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        const { data: wilayasData, error: wilayasError } = await supabase.from('wilayas').select('id, name');
        const { data: citiesData, error: citiesError } = await supabase.from('cities').select('id, name, wilaya_id');

        if (wilayasError || citiesError) {
            toast.error(t('dataFetchError'));
            console.error(wilayasError || citiesError);
        } else {
            setDbWilayas(new Map(wilayasData.map(w => [w.name, w.id])));
            setDbCities(new Map(citiesData.map(c => [`${c.name}-${c.wilaya_id}`, c.id])));
        }
        setLoading(false);
    }, [t]);

    useEffect(() => {
        if (isAdmin) {
            fetchLocations();
        } else if (isAdmin === false) {
            navigate('/');
        }
    }, [isAdmin, navigate, fetchLocations]);

    const deactivateWilaya = async (name, wilayaId) => {
        setProcessingId(`wilaya-${name}`);
        setModal({ isOpen: false, data: null });

        // Deactivate all cities under this wilaya first
        const citiesToDelete = algeriaGeoData[name].map(cityName => dbCities.get(`${cityName}-${wilayaId}`)).filter(Boolean);
        if (citiesToDelete.length > 0) {
            const { error: cityError } = await supabase.from('cities').delete().in('id', citiesToDelete);
            if (cityError) {
                toast.error(`Failed to deactivate cities for ${name}: ${cityError.message}`);
                setProcessingId(null);
                return;
            }
        }

        const { error: wilayaError } = await supabase.from('wilayas').delete().eq('id', wilayaId);
        if (wilayaError) {
            toast.error(`Failed to deactivate ${name}: ${wilayaError.message}`);
        } else {
            toast.success(`${name} and its cities have been deactivated.`);
            fetchLocations();
        }
        setProcessingId(null);
    };

    const handleToggleWilaya = async (wilayaName) => {
        const wilayaId = dbWilayas.get(wilayaName);

        if (wilayaId) {
            // It's active, so show confirmation modal to deactivate
            setModal({
                isOpen: true,
                data: {
                    title: `Deactivate ${wilayaName}?`,
                    text: `This will also deactivate all its cities. This action is irreversible.`,
                    confirmText: 'Deactivate',
                    isDestructive: true,
                    onConfirm: () => deactivateWilaya(wilayaName, wilayaId),
                }
            });
        } else {
            // It's inactive, activate it directly
            setProcessingId(`wilaya-${wilayaName}`);
            const { error } = await supabase.from('wilayas').insert({ name: wilayaName });
            if (error) {
                toast.error(error.message);
            } else {
                toast.success(`${wilayaName} activated.`);
                await fetchLocations();
            }
            setProcessingId(null);
        }
    };

    const handleToggleCity = async (cityName, wilayaName) => {
        const wilayaId = dbWilayas.get(wilayaName);
        if (!wilayaId) return;

        setProcessingId(`city-${cityName}-${wilayaId}`);
        const cityId = dbCities.get(`${cityName}-${wilayaId}`);
        let error;

        if (cityId) {
            ({ error } = await supabase.from('cities').delete().eq('id', cityId));
        } else {
            ({ error } = await supabase.from('cities').insert({ name: cityName, wilaya_id: wilayaId }));
        }

        if (error) {
            toast.error(error.message);
        } else {
            await fetchLocations(); // Await the fetch to ensure data is fresh
        }
        setProcessingId(null);
    };
    
    const filteredWilayas = useMemo(() => {
        if (!searchTerm) return allWilayas;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return allWilayas.filter(wilayaName =>
            wilayaName.toLowerCase().includes(lowerCaseSearch) ||
            algeriaGeoData[wilayaName].some(cityName => cityName.toLowerCase().includes(lowerCaseSearch))
        );
    }, [allWilayas, searchTerm]);


    return (
        <DashboardLayout title={t('locationManagement')} description={t('locationManagementDesc')}>
            {modal.isOpen && (
                <ConfirmationModal
                    title={modal.data.title}
                    text={modal.data.text}
                    confirmText={modal.data.confirmText}
                    onConfirm={modal.data.onConfirm}
                    onCancel={() => setModal({ isOpen: false, data: null })}
                    isDestructive={modal.data.isDestructive}
                />
            )}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search for a wilaya or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md"
                />
            </div>
            {loading ? <p>{t('loading')}</p> : (
                <>
                    {filteredWilayas.length > 0 ? (
                        <div className="space-y-4">
                            {filteredWilayas.map(wilayaName => {
                                const wilayaId = dbWilayas.get(wilayaName);
                                const isWilayaActive = !!wilayaId;
                                return (
                                    <div key={wilayaName} className="bg-white p-4 rounded-lg shadow-md">
                                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                                            <h3 className="text-lg font-bold flex items-center"><MapPin size={18} className="mr-2" /> {wilayaName}</h3>
                                            <div className="w-10 h-6 flex items-center justify-center">
                                                {processingId === `wilaya-${wilayaName}` ? (
                                                    <LoaderCircle size={20} className="animate-spin text-slate-400" />
                                                ) : (
                                                    <button onClick={() => handleToggleWilaya(wilayaName)} disabled={!!processingId}>
                                                        {isWilayaActive ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} className="text-slate-400" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isWilayaActive && (
                                            <div className="pl-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                {algeriaGeoData[wilayaName].map(cityName => {
                                                    const isCityActive = dbCities.has(`${cityName}-${wilayaId}`);
                                                    const cityProcessingId = `city-${cityName}-${wilayaId}`;
                                                    return (
                                                        <div key={cityName} className="flex justify-between items-center py-1">
                                                            <span className="text-sm text-slate-600">- {cityName}</span>
                                                            <div className="w-8 h-5 flex items-center justify-center">
                                                                {processingId === cityProcessingId ? (
                                                                    <LoaderCircle size={16} className="animate-spin text-slate-400" />
                                                                ) : (
                                                                    <button onClick={() => handleToggleCity(cityName, wilayaName)} disabled={!!processingId}>
                                                                        {isCityActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-slate-400" />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                            <AlertTriangle size={48} className="mx-auto text-slate-400" />
                            <h3 className="mt-4 text-xl font-semibold text-slate-800">No Locations Found</h3>
                            <p className="mt-2 text-slate-500">No locations matched your search criteria.</p>
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}