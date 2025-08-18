import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

export const BookingProgressBar = ({ status }) => {
    const { t } = useTranslation();
    const statuses = ['confirmed', 'picked-up', 'returned'];
    const currentStatusIndex = statuses.indexOf(status);

    const statusTranslations = {
        confirmed: t('statusActive'),
        'picked-up': t('statusPickedUp'),
        returned: t('statusReturned'),
    };

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                {statuses.map((s, index) => (
                    <div key={s} className="text-center" style={{ width: `${100 / statuses.length}%` }}>
                        <span className={`text-xs ${index <= currentStatusIndex ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                            {statusTranslations[s]}
                        </span>
                    </div>
                ))}
            </div>
            <div className="relative w-full h-2 bg-slate-200 rounded-full">
                <div
                    className="absolute top-0 left-0 h-2 bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
                ></div>
                 <div className="absolute flex justify-between w-full h-2">
                    {statuses.map((s, index) => (
                        <div
                            key={s}
                            className={`w-4 h-4 rounded-full -mt-1 ${index <= currentStatusIndex ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};