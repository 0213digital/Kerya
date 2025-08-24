import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

export const BookingProgressBar = ({ status }) => {
    const { t } = useTranslation();
    const statuses = ['pending_approval', 'confirmed', 'picked-up', 'returned'];
    const currentStatusIndex = statuses.indexOf(status);

    // Si le statut est "cancelled", on n'affiche pas la barre de progression.
    if (status === 'cancelled') {
        return null; 
    }

    const statusTranslations = {
        pending_approval: t('statusPendingApproval'),
        confirmed: t('statusActive'),
        'picked-up': t('statusPickedUp'),
        returned: t('statusReturned'),
    };
    
    // Filtre les statuts non pertinents pour l'affichage (si 'pending_approval' n'est pas le statut)
    const displayStatuses = status === 'pending_approval' ? statuses : statuses.slice(1);
    const displayStatusIndex = displayStatuses.indexOf(status);


    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                {displayStatuses.map((s, index) => (
                    <div key={s} className="text-center" style={{ width: `${100 / displayStatuses.length}%` }}>
                        <span className={`text-xs ${index <= displayStatusIndex ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                            {statusTranslations[s]}
                        </span>
                    </div>
                ))}
            </div>
            <div className="relative w-full h-2 bg-slate-200 rounded-full">
                <div
                    className="absolute top-0 left-0 h-2 bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${(displayStatusIndex / (displayStatuses.length - 1)) * 100}%` }}
                ></div>
                 <div className="absolute flex justify-between w-full h-2">
                    {displayStatuses.map((s, index) => (
                        <div
                            key={s}
                            className={`w-4 h-4 rounded-full -mt-1 ${index <= displayStatusIndex ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};