import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Send } from 'lucide-react';

export function ChatWindow({ conversation, onMessageSent }) {
    const { t } = useTranslation();
    const { profile: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            if (!conversation) return;
            setLoading(true);
            const { data } = await supabase
                .from('messages')
                .select('*, sender:profiles(id, full_name, avatar_url)')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: true });
            setMessages(data || []);
            setLoading(false);
        };
        fetchMessages();
        
        const subscription = supabase
            .channel(`messages:${conversation.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, (payload) => {
                setMessages(currentMessages => [...currentMessages, payload.new]);
            })
            .subscribe();
            
        return () => supabase.removeChannel(subscription);

    }, [conversation]);

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser) return;

        const otherParticipant = currentUser.id === conversation.user_id ? conversation.agencies.owner_id : conversation.user_id;

        const { error } = await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            receiver_id: otherParticipant,
            content: newMessage,
        });

        if (!error) {
            setNewMessage('');
            if (onMessageSent) onMessageSent();
        } else {
            console.error("Error sending message:", error);
        }
    };
    
    if (loading) return <div className="p-4 text-center">{t('loading')}...</div>;
    if (!conversation) return null;
    
    const otherParticipant = currentUser.id === conversation.user_id ? conversation.agencies.profiles : conversation.profiles;
    const otherName = currentUser.id === conversation.user_id ? conversation.agencies.agency_name : otherParticipant.full_name;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-white">
                <h3 className="font-bold">{t('conversationWith', { name: otherName })}</h3>
                <p className="text-sm text-slate-500">{t('regarding', { make: conversation.vehicles.make, model: conversation.vehicles.model })}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender_id === currentUser.id ? 'bg-indigo-500 text-white' : 'bg-white shadow-sm'}`}>
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.sender_id === currentUser.id ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(msg.created_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                ))}
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