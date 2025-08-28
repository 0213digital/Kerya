// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Send, Mic, ImagePlus, XCircle, CheckCircle } from 'lucide-react';

export function ChatWindow({ conversation }) {
    const { t } = useTranslation();
    const { profile: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const fileInputRef = useRef(null);

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
        if (!conversation?.id || !currentUser?.id) return;
        
        fetchMessages();
        
        const channel = supabase.channel(`chat-room-${conversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversation.id}`
                },
                async (payload) => {
                    if (payload.new.sender_id === currentUser.id) return;
                    
                    const { data: senderProfile, error } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', payload.new.sender_id).single();
                    
                    if (!error) {
                        const newMessageWithSender = { ...payload.new, sender: senderProfile };
                        setMessages(currentMessages => [...currentMessages, newMessageWithSender]);
                    }
                }
            )
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation?.id, currentUser?.id, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const sendMessage = useCallback(async ({ content = null, imageUrl = null, audioUrl = null }) => {
        if (!currentUser || !conversation) return;
        if (!content && !imageUrl && !audioUrl) return;

        const isCurrentUserRenter = currentUser.id === conversation.user.id;
        // Correctly identify the receiver's ID from the nested 'owner' object
        const receiverId = isCurrentUserRenter ? conversation.agency.owner_id : conversation.user.id;

        const optimisticMessage = {
            id: Date.now(),
            content: content,
            image_url: imageUrl,
            audio_url: audioUrl,
            created_at: new Date().toISOString(),
            sender_id: currentUser.id,
            sender: currentUser,
        };
        setMessages(currentMessages => [...currentMessages, optimisticMessage]);

        const { error } = await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            receiver_id: receiverId,
            content: content,
            image_url: imageUrl,
            audio_url: audioUrl,
        });

        if (!error) {
            await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id);
        } else {
            console.error("Error sending message:", error);
        }
    }, [currentUser, conversation]);

    const handleSendText = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        sendMessage({ content: newMessage.trim() });
        setNewMessage('');
    };

    const handleImageSelect = async (event) => {
        const file = event.target.files[0];
        if (!file || !currentUser) return;

        const filePath = `${currentUser.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('media_uploads')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return;
        }

        const { data } = supabase.storage.from('media_uploads').getPublicUrl(filePath);
        if (data?.publicUrl) {
            sendMessage({ imageUrl: data.publicUrl });
        }
    };
    
    const handleToggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                const audioChunks = [];

                recorder.ondataavailable = event => audioChunks.push(event.data);
                recorder.onstop = () => {
                    const blob = new Blob(audioChunks, { type: 'audio/webm' });
                    setAudioBlob(blob);
                    stream.getTracks().forEach(track => track.stop());
                };
                recorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
            }
        }
    };
    
    const handleSendAudio = async () => {
        if (!audioBlob || !currentUser) return;

        const filePath = `${currentUser.id}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
            .from('media_uploads')
            .upload(filePath, audioBlob);

        if (uploadError) {
            console.error('Error uploading audio:', uploadError);
            return;
        }

        const { data } = supabase.storage.from('media_uploads').getPublicUrl(filePath);
        if (data?.publicUrl) {
            sendMessage({ audioUrl: data.publicUrl });
        }
        setAudioBlob(null);
    };

    if (loading) return <div className="p-4 text-center">{t('loading')}...</div>;
    if (!currentUser || !conversation) return null;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b bg-white shadow-sm">
                <p className="font-bold">{conversation.agency.agency_name}</p>
                <p className="text-sm text-slate-500">{t('regarding', { make: conversation.vehicles.make, model: conversation.vehicles.model })}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender_id !== currentUser.id && <img src={msg.sender?.avatar_url || 'https://placehold.co/40x40/E2E8F0/64748B?text=U'} alt="avatar" className="w-8 h-8 rounded-full bg-slate-200" />}
                        <div className={`max-w-xs md:max-w-md p-1 rounded-lg ${msg.sender_id === currentUser.id ? 'bg-indigo-600 text-white' : 'bg-white shadow-sm'}`}>
                            {msg.image_url && (
                                <img
                                    src={msg.image_url}
                                    alt="Image message"
                                    className="rounded-lg max-w-full h-auto cursor-pointer"
                                    onClick={() => setSelectedImage(msg.image_url)}
                                />
                            )}
                            {msg.audio_url && <audio controls src={msg.audio_url} className="w-full h-12"></audio>}
                            {msg.content && <p className="p-2 break-words">{msg.content}</p>}
                            <p className={`text-xs px-2 pb-1 text-right ${msg.sender_id === currentUser.id ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
                {audioBlob ? (
                    <div className="flex items-center gap-4">
                        <p className="flex-1 text-sm">{t('sendAudioPrompt')}</p>
                        <button onClick={() => setAudioBlob(null)} className="p-2 rounded-full text-red-500 hover:bg-red-100"><XCircle /></button>
                        <button onClick={handleSendAudio} className="p-2 rounded-full text-green-500 hover:bg-green-100"><CheckCircle /></button>
                    </div>
                ) : (
                    <form onSubmit={handleSendText} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isRecording ? t('recording')+'...' : t('typeYourMessage')}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            disabled={isRecording}
                        />
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 rounded-full hover:bg-slate-100"><ImagePlus /></button>
                        <button type="button" onClick={handleToggleRecording} className={`p-3 rounded-full hover:bg-slate-100 ${isRecording ? 'bg-red-500 text-white' : ''}`}><Mic /></button>
                        <button type="submit" className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400" disabled={!newMessage.trim()}><Send size={18} /></button>
                    </form>
                )}
            </div>

            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={selectedImage}
                            alt="Full screen view"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-3 -right-3 bg-white text-black rounded-full p-1 shadow-lg"
                        >
                            <XCircle size={28} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
