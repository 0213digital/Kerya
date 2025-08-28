import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { carData } from '../data/geoAndCarData';
import { X, UploadCloud } from 'lucide-react';

// --- CancellationModal (New) ---
export function CancellationModal({ booking, onClose, onConfirm, processing }) {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t('cancelBooking')}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium">{t('cancellationReason')}</label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('reasonPlaceholder')}
                            rows="4"
                            className="mt-1 w-full p-2 border border-slate-300 rounded-md"
                        />
                    </div>
                </div>
                <div className="bg-slate-50 px-6 py-3 flex justify-end space-x-3">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">{t('cancel')}</button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason || processing}
                        type="button"
                        className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                    >
                        {processing ? t('processing') : t('confirmCancellation')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- EditUserModal ---
export function EditUserModal({ user, onSave, onClose }) {
    const { t } = useTranslation();
    const [fullName, setFullName] = useState(user.full_name || '');
    const [phoneNumber, setPhoneNumber] = useState(user.phone_number || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave({ full_name: fullName, phone_number: phoneNumber });
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t('editProfile')}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium">{t('fullName')}</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">{t('phoneNumber')}</label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">+213</span>
                            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))} className="w-full p-2 pl-12 border border-slate-300 rounded-md bg-white" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-100 hover:bg-slate-200">{t('cancel')}</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">{loading ? t('processing') : t('saveChanges')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- FileUploadBox ---
export const FileUploadBox = ({ type, label, url, uploading, onChange }) => {
    const { t } = useTranslation();
    return (
        <div>
            <label className="block text-sm font-medium">{label}</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    {url ? <img src={url} alt={`${label} Preview`} className="mx-auto mb-4 h-32 object-contain" /> : <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />}
                    <div className="flex text-sm text-slate-600">
                        <label htmlFor={`${type}-upload`} className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                            <span>{t('uploadFile')}</span>
                            <input id={`${type}-upload`} name={`${type}-upload`} type="file" className="sr-only" onChange={(e) => onChange(e, type)} disabled={uploading} accept="image/*,.pdf" />
                        </label>
                    </div>
                    {uploading && <p>{t('loading')}</p>}
                </div>
            </div>
        </div>
    );
};

// --- VehicleFormModal (UPDATED with improvements) ---
export function VehicleFormModal({ vehicleToEdit, agencyId, onClose, onSave }) {
    const { t } = useTranslation();
    const [formState, setFormState] = useState({
        make: vehicleToEdit?.make || '', model: vehicleToEdit?.model || '', year: vehicleToEdit?.year || '',
        transmission: vehicleToEdit?.transmission || 'manual', fuel_type: vehicleToEdit?.fuel_type || 'gasoline',
        seats: vehicleToEdit?.seats || '', daily_rate_dzd: vehicleToEdit?.daily_rate_dzd || '',
        security_deposit_dzd: vehicleToEdit?.security_deposit_dzd || 0,
        description: vehicleToEdit?.description || '', image_urls: vehicleToEdit?.image_urls || [],
        car_registration_url: vehicleToEdit?.car_registration_url || '',
    });
    const [isUploading, setIsUploading] = useState(false);
    const [models, setModels] = useState([]);
    const [error, setError] = useState(''); // State for all error messages

    useEffect(() => {
        if (formState.make) {
            setModels(carData[formState.make] || []);
        } else {
            setModels([]);
        }
    }, [formState.make]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const handleMakeChange = (e) => {
        const make = e.target.value;
        setFormState(prev => ({ ...prev, make: make, model: '' }));
    };

    const handleFileUpload = async (e, fileType) => {
        const file = e.target.files[0];
        if (!file || !agencyId) return;

        // --- Improvement: File Type Validation ---
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const allowedDocTypes = [...allowedImageTypes, 'application/pdf'];
        const allowedTypes = fileType === 'image' ? allowedImageTypes : allowedDocTypes;

        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only images (JPG, PNG, WebP) and PDFs are allowed.');
            return;
        }
        
        // --- Improvement: Better Error Handling ---
        setIsUploading(true);
        setError(''); // Clear previous errors

        const bucket = fileType === 'image' ? 'vehicle-images' : 'agency-documents';
        const folder = fileType === 'image' ? 'vehicle_images' : 'car_registrations';
        const fileName = `${agencyId}/${folder}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            setError(`Upload failed: ${uploadError.message}`); // Set a user-friendly error
        } else {
            const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
            if (fileType === 'image') {
                setFormState(prev => ({ ...prev, image_urls: [...prev.image_urls, data.publicUrl] }));
            } else {
                 setFormState(prev => ({ ...prev, car_registration_url: data.publicUrl }));
            }
        }
        setIsUploading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formState.car_registration_url) {
            setError(t('pleaseUploadRegCard'));
            return;
        }
        const vehicleData = { ...formState, agency_id: agencyId };
        const { error: dbError } = vehicleToEdit
            ? await supabase.from('vehicles').update(vehicleData).eq('id', vehicleToEdit.id)
            : await supabase.from('vehicles').insert([vehicleData]);

        if (dbError) {
            setError(dbError.message);
        } else {
            onSave();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center"><h3 className="text-xl font-bold">{vehicleToEdit ? t('editVehicleTitle') : t('listNewVehicleTitle')}</h3><button onClick={onClose}><X /></button></div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* --- Improvement: Displaying Errors --- */}
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">{t('make')}</label><select name="make" value={formState.make} onChange={handleMakeChange} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"><option value="">{t('selectAMake')}</option>{Object.keys(carData).map(make => <option key={make} value={make}>{make}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">{t('model')}</label><select name="model" value={formState.model} onChange={handleChange} disabled={!formState.make} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white disabled:bg-slate-100"><option value="">{t('selectAModel')}</option>{models.map(model => <option key={model} value={model}>{model}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">{t('year')}</label><input name="year" type="number" value={formState.year} onChange={handleChange} placeholder={t('yearPlaceholder')} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                        <div><label className="block text-sm font-medium">{t('dailyRateDZD')}</label><input name="daily_rate_dzd" type="number" value={formState.daily_rate_dzd} onChange={handleChange} placeholder={t('ratePlaceholder')} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                        <div><label className="block text-sm font-medium">{t('securityDeposit')} (DZD)</label><input name="security_deposit_dzd" type="number" value={formState.security_deposit_dzd} onChange={handleChange} placeholder="10000" className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                        <div><label className="block text-sm font-medium">{t('seats')}</label><input name="seats" type="number" value={formState.seats} onChange={handleChange} placeholder={t('seatsPlaceholder')} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white" /></div>
                        <div><label className="block text-sm font-medium">{t('transmission')}</label><select name="transmission" value={formState.transmission} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"><option value="manual">{t('manual')}</option><option value="automatic">{t('automatic')}</option></select></div>
                        <div><label className="block text-sm font-medium">{t('fuelType')}</label><select name="fuel_type" value={formState.fuel_type} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"><option value="gasoline">{t('gasoline')}</option><option value="diesel">{t('diesel')}</option></select></div>
                    </div>
                    <div><label className="block text-sm font-medium">{t('description')}</label><textarea name="description" value={formState.description} onChange={handleChange} placeholder={t('descriptionPlaceholder')} rows="3" className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"></textarea></div>
                    <FileUploadBox type="car_registration" label={t('carRegistrationCard')} url={formState.car_registration_url} uploading={isUploading} onChange={(e) => handleFileUpload(e, 'car_registration')} />
                    <p className="text-xs text-slate-500">{t('carRegistrationCardDesc')}</p>
                    <FileUploadBox type="image" label={t('vehicleImages')} url={null} uploading={isUploading} onChange={(e) => handleFileUpload(e, 'image')} />
                    <div className="mt-2 flex flex-wrap gap-2">
                        {formState.image_urls.map(url => <img key={url} src={url} className="h-20 w-20 object-cover rounded-md" alt="Vehicle" />)}
                    </div>
                    <div className="p-4 border-t border-slate-200 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-100 hover:bg-slate-200">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">{vehicleToEdit ? t('updateVehicle') : t('saveVehicle')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- DeleteConfirmationModal, RejectionModal, ConfirmationModal (Unchanged) ---
export function DeleteConfirmationModal({ item, onCancel, onConfirm }) {
    const { t } = useTranslation();
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <h3 className="text-lg font-medium">{t('deleteConfirmTitle')}</h3>
                    <p className="mt-2 text-sm text-slate-500">{t('deleteConfirmText')}</p>
                </div>
                <div className="bg-slate-50 px-6 py-3 flex justify-end space-x-3">
                    <button onClick={onCancel} type="button" className="px-4 py-2 text-sm font-medium rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">{t('cancel')}</button>
                    <button onClick={onConfirm} type="button" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">{t('delete')}</button>
                </div>
            </div>
        </div>
    );
}

export function RejectionModal({ onCancel, onSubmit, processing }) {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <h3 className="text-lg font-medium">{t('rejectionReasonPrompt')}</h3>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="4" className="mt-2 w-full p-2 border border-slate-300 rounded-md bg-white"></textarea>
                </div>
                <div className="bg-slate-50 px-6 py-3 flex justify-end space-x-3">
                    <button onClick={onCancel} type="button" className="px-4 py-2 text-sm font-medium rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">{t('cancel')}</button>
                    <button onClick={() => onSubmit(reason)} disabled={!reason || processing} type="button" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400">{processing ? t('processing') : t('submitRejection')}</button>
                </div>
            </div>
        </div>
    );
}

export function ConfirmationModal({ title, text, confirmText, onConfirm, onCancel, isDestructive = false }) {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <h3 className="text-lg font-medium">{title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{text}</p>
                </div>
                <div className="bg-slate-50 px-6 py-3 flex justify-end space-x-3">
                    <button onClick={onCancel} type="button" className="px-4 py-2 text-sm font-medium rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">{t('cancel')}</button>
                    <button
                        onClick={onConfirm}
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-md text-white ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}