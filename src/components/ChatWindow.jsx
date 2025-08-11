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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = useCallback(async () => {
        if (!conversation?.id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:sender_id(id, full_name, avatar_url)')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });
        
        if (error) console.error("Error fetching messages:", error);
        else setMessages(data || []);
        
        setLoading(false);
    }, [conversation?.id]);

    useEffect(() => {
        if (!conversation?.id) return;

        fetchMessages();
        
        const channel = supabase
            .channel(`messages:${conversation.id}`)
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, 
                async (payload) => {
                    // --- NOUVELLE LOGIQUE DE RÉCEPTION ---
                    // On ignore la notification de notre propre message, car on l'affiche déjà de manière optimiste.
                    if (payload.new.sender_id === currentUser.id) {
                        return;
                    }
                    
                    // Pour les messages des autres, on récupère le profil et on ajoute le message.
                    const { data: senderProfile, error } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .eq('id', payload.new.sender_id)
                        .single();
                    
                    if (!error) {
                        const newMessageWithSender = { ...payload.new, sender: senderProfile };
                        setMessages(currentMessages => [...currentMessages, newMessageWithSender]);
                    } else {
                        console.error('Error fetching profile for new message:', error);
                    }
                }
            )
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation?.id, fetchMessages, currentUser?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser || !conversation) return;

        const isCurrentUserRenter = currentUser.id === conversation.user.id;
        const receiverId = isCurrentUserRenter ? conversation.agency.owner_id : conversation.user.id;
        const content = newMessage;
        
        // Vider le champ de saisie immédiatement
        setNewMessage('');

        // --- MISE À JOUR OPTIMISTE ---
        // 1. On crée un message temporaire avec les infos qu'on a déjà.
        const optimisticMessage = {
            id: Date.now(), // ID temporaire
            content: content,
            created_at: new Date().toISOString(),
            sender_id: currentUser.id,
            sender: { // On inclut l'objet sender complet pour un affichage correct
                id: currentUser.id,
                full_name: currentUser.full_name,
                avatar_url: currentUser.avatar_url,
            }
        };

        // 2. On l'ajoute directement à l'état pour un affichage instantané.
        setMessages(currentMessages => [...currentMessages, optimisticMessage]);

        // 3. On envoie le vrai message à la base de données en arrière-plan.
        const { error } = await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            receiver_id: receiverId,
            content: content,
        });

        if (error) {
            console.error("Error sending message:", error);
            // Ici, on pourrait ajouter une logique pour marquer le message comme "non envoyé".
            // Pour l'instant, on se contente de logguer l'erreur.
        } else {
             // Mettre à jour la conversation pour la faire remonter dans la liste
             await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id);
        }
    };
    
    if (loading) return <div className="p-4 text-center">{t('loading')}...</div>;
    if (!currentUser || !conversation) return null;
    
    const otherParticipant = currentUser.id === conversation.user.id ? conversation.agency : conversation.user;
    const displayName = currentUser.id === conversation.user.id ? otherParticipant.agency_name : otherParticipant.full_name;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b bg-white shadow-sm">
                <h3 className="font-bold">{t('conversationWith', { name: displayName })}</h3>
                <p className="text-sm text-slate-500">{t('regarding', { make: conversation.vehicles.make, model: conversation.vehicles.model })}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                    const isMyMessage = msg.sender_id === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                             {!isMyMessage && <img src={msg.sender?.avatar_url || 'https://placehold.co/40x40/E2E8F0/64748B?text=U'} alt="avatar" className="w-8 h-8 rounded-full bg-slate-200" />}
                            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isMyMessage ? 'bg-indigo-600 text-white' : 'bg-white shadow-sm'}`}>
                                <p className="break-words">{msg.content}</p>
                                <p className={`text-xs mt-1 text-right ${isMyMessage ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
                        className="w-full p-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400" disabled={!newMessage.trim()}>
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}