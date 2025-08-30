import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/DashboardLayout';
import { RejectionModal } from '../../components/modals';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
        const { error } = await supabase.from('agencies').update({ verification_status: 'verified', rejection_reason: null }).eq('id', id);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Agency approved successfully!');
            navigate('/admin/dashboard');
        }
        setProcessing(false);
    };

    const handleReject = async (reason) => {
        setProcessing(true);
        const { error } = await supabase.from('agencies').update({ verification_status: 'rejected', rejection_reason: reason }).eq('id', id);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Agency rejected.');
            setShowRejectionModal(false);
            navigate('/admin/dashboard');
        }
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
