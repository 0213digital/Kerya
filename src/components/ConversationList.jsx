import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

export function ConversationList({ conversations, activeConversationId, onSelect, currentUserId }) {
    const { t } = useTranslation();

    if (!conversations || conversations.length === 0) {
        return <div className="p-4 text-center text-slate-500">{t('noConversations')}</div>;
    }

    return (
        <ul className="divide-y divide-slate-200">
            {conversations.map(convo => {
                const otherParticipant = currentUserId === convo.user_id ? convo.agencies.profiles : convo.profiles;
                const otherName = currentUserId === convo.user_id ? convo.agencies.agency_name : otherParticipant.full_name;

                return (
                    <li
                        key={convo.id}
                        onClick={() => onSelect(convo.id)}
                        className={`p-4 cursor-pointer hover:bg-slate-100 ${convo.id === activeConversationId ? 'bg-indigo-50' : ''}`}
                    >
                        <div className="flex items-center space-x-3">
                            <img
                                src={otherParticipant.avatar_url || convo.agencies.profiles.avatar_url || `https://placehold.co/40x40/e2e8f0/64748b?text=${otherName?.[0] || 'A'}`}
                                alt="avatar"
                                className="h-10 w-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <p className="font-semibold text-slate-800">{otherName}</p>
                                <p className="text-sm text-slate-600 truncate">{t('regarding', { make: convo.vehicles.make, model: convo.vehicles.model })}</p>
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}