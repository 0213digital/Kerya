import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Send } from 'lucide-react';

export function ChatWindow({ conversation }) {
    const { t } = useTranslation();
    const { profile: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    const fetchMessages = useCallback(async () => {
        if (!conversation) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles(id, full_name, avatar_url)')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });
        
        if(error) console.error("Error fetching messages:", error);
        else setMessages(data || []);
        
        setLoading(false);
    }, [conversation.id]);


    useEffect(() => {
        fetchMessages();
        
        const channel = supabase
            .channel(`messages:${conversation.id}`)
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, 
                (payload) => {
                    // Add the new message to the state, ensuring we have sender info if possible
                    const newMessage = { ...payload.new, sender: { id: payload.new.sender_id }};
                    setMessages(currentMessages => [...currentMessages, newMessage]);
                }
            )
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation.id, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser) return;
        
        const isCurrentUserRenter = currentUser.id === conversation.user.id;
        const receiverId = isCurrentUserRenter ? conversation.agency.owner_id : conversation.user.id;

        const { error } = await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            receiver_id: receiverId,
            content: newMessage,
        });

        if (!error) {
            setNewMessage('');
            // The subscription will handle the UI update, but we also need to update the conversation's `updated_at`
            await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id);
        } else {
            console.error("Error sending message:", error);
        }
    };
    
    if (loading) return <div className="p-4 text-center">{t('loading')}...</div>;
    if (!conversation) return null;
    
    const isCurrentUserRenter = currentUser.id === conversation.user.id;
    const otherParticipant = isCurrentUserRenter ? conversation.agency : conversation.user;
    const displayName = isCurrentUserRenter ? otherParticipant.agency_name : otherParticipant.full_name;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-white">
                <h3 className="font-bold">{t('conversationWith', { name: displayName })}</h3>
                <p className="text-sm text-slate-500">{t('regarding', { make: conversation.vehicles.make, model: conversation.vehicles.model })}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                {messages.map(msg => {
                    const isMyMessage = msg.sender_id === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isMyMessage ? 'bg-indigo-500 text-white' : 'bg-white shadow-sm'}`}>
                                <p>{msg.content}</p>
                                <p className={`text-xs mt-1 text-right ${isMyMessage ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(msg.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    );
                })}
                 <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                <div className="relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('typeYourMessage')}
                        className="w-full p-2 pr-12 border border-slate-300 rounded-lg"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700">
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}