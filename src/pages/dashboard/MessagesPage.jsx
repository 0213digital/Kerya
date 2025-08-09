import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ConversationList } from '../../components/ConversationList';
import { ChatWindow } from '../../components/ChatWindow';
import { MessageSquare, Inbox } from 'lucide-react';

export function MessagesPage() {
    const { t } = useTranslation();
    const { profile, isAgencyOwner } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchConversations = useCallback(async () => {
        if (!profile) return;
        setLoading(true);

        let query = supabase
            .from('conversations')
            .select(`
                id,
                updated_at,
                vehicles (id, make, model),
                user:profiles!conversations_user_id_fkey (id, full_name, avatar_url),
                agency:agencies (id, agency_name, owner_id, owner:profiles!agencies_owner_id_fkey(id, avatar_url))
            `)
            .order('updated_at', { ascending: false });

        if (isAgencyOwner) {
            const { data: agencyData } = await supabase.from('agencies').select('id').eq('owner_id', profile.id).single();
            if (agencyData) {
                query = query.eq('agency_id', agencyData.id);
            }
        } else {
            query = query.eq('user_id', profile.id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching conversations:', error);
        } else {
            setConversations(data || []);
            // Update active conversation ID only if it's not set or no longer exists
            if (data && data.length > 0 && (!activeConversationId || !data.some(c => c.id === activeConversationId))) {
                setActiveConversationId(data[0].id);
            } else if (data.length === 0) {
                setActiveConversationId(null);
            }
        }
        setLoading(false);
    }, [profile, isAgencyOwner, activeConversationId]); // activeConversationId is needed here to avoid stale state issues

    // Initial fetch
    useEffect(() => {
        fetchConversations();
    }, [profile, isAgencyOwner]); // Removed fetchConversations from dependencies to run only once on profile load

    // Real-time updates for conversations
    useEffect(() => {
        const channel = supabase
            .channel('public:conversations')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                (payload) => {
                    // Refetch all conversations to get the latest order and data
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchConversations]);
    
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    return (
        <DashboardLayout title={t('messagesTitle')} description={t('messagesDesc')}>
            <div className="bg-white rounded-lg shadow-md h-[70vh] flex">
                <aside className="w-full md:w-1/3 border-r overflow-y-auto">
                    {loading ? (
                        <p className="p-4">{t('loading')}...</p>
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            activeConversationId={activeConversationId}
                            onSelect={setActiveConversationId}
                            currentUserId={profile?.id}
                        />
                    )}
                </aside>
                <main className="hidden md:flex w-2/3 flex-col">
                    {activeConversation ? (
                        <ChatWindow 
                            key={activeConversation.id} // Add key to force re-mount on conversation change
                            conversation={activeConversation} 
                        />
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-slate-500">
                           <Inbox size={48} />
                           <p className="mt-4">{conversations.length > 0 ? t('noMessagesInConversation') : t('noConversations')}</p>
                        </div>
                    )}
                </main>
            </div>
        </DashboardLayout>
    );
}