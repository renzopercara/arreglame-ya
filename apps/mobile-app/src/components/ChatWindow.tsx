
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CHAT_MESSAGES, SEND_CHAT_MESSAGE, CHAT_SUBSCRIPTION } from '../graphql/queries';
import { ChatMessage, UserRole, JobStatus } from '../types';
import { Send, X, MessageCircle, User, HardHat, Lock, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

interface ChatWindowProps {
    jobId: string;
    jobStatus: JobStatus;
    currentUserId: string;
    currentUserRole: UserRole;
    otherUserName: string;
    visible: boolean;
    onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
    jobId, 
    jobStatus,
    currentUserId, 
    currentUserRole, 
    otherUserName,
    visible, 
    onClose 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSuspended, setIsSuspended] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isChatActive = [
        JobStatus.ASSIGNED, 
        JobStatus.IN_PROGRESS, 
        JobStatus.PENDING_CLIENT_APPROVAL
    ].includes(jobStatus);

    const { data, loading, subscribeToMore } = useQuery<{ chatMessages: ChatMessage[] }>(GET_CHAT_MESSAGES, {
        variables: { jobId },
        skip: !visible,
        fetchPolicy: 'cache-and-network'
    });

    const [sendMessage] = useMutation(SEND_CHAT_MESSAGE);

    useEffect(() => {
        if (!visible) return;

        const unsubscribe = subscribeToMore<{ chatMessageAdded: ChatMessage }>({
            document: CHAT_SUBSCRIPTION,
            variables: { jobId },
            updateQuery: (prev: any, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const newMessage = subscriptionData.data.chatMessageAdded;
                if (prev.chatMessages.find((m: ChatMessage) => m.id === newMessage.id)) return prev;
                return {
                    ...prev,
                    chatMessages: [...prev.chatMessages, newMessage]
                };
            }
        });

        return () => unsubscribe();
    }, [visible, jobId, subscribeToMore]);

    const messages: ChatMessage[] = data?.chatMessages || [];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if(visible && isChatActive) setIsOpen(true);
    }, [visible, isChatActive]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !isChatActive || isSuspended) return;
        
        setErrorMsg(null);
        try {
            await sendMessage({
                variables: {
                    jobId,
                    senderId: currentUserId,
                    role: currentUserRole,
                    content: newMessage
                }
            });
            setNewMessage('');
        } catch (err: any) {
            const msg = err.message || "";
            if (msg.includes('SUSPENDIDA')) {
                setIsSuspended(true);
                setErrorMsg("⚠️ TU CUENTA HA SIDO SUSPENDIDA POR INTENTOS DE FRAUDE.");
                setTimeout(() => window.location.reload(), 3000);
            } else if (msg.includes('BLOQUEADO')) {
                setErrorMsg("⚠️ Mensaje bloqueado: No podés compartir datos de contacto o negociar precios.");
            } else {
                setErrorMsg("Error al enviar el mensaje.");
            }
        }
    };

    if (!visible) return null;

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-4 z-[900] bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center animate-in slide-in-from-bottom"
            >
                <MessageCircle size={28} />
                {isChatActive && (
                    <span className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-4 w-full sm:w-96 h-full sm:h-[550px] bg-white sm:rounded-3xl shadow-2xl flex flex-col z-[1000] animate-in slide-in-from-bottom-4 border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 shadow-md">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center ring-2 ring-white/20">
                            {currentUserRole === UserRole.CLIENT ? <User size={20} /> : <HardHat size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">{otherUserName}</h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                                {isChatActive ? 'Canal Seguro Activo' : 'Conversación Finalizada'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-2.5 flex items-start gap-3 border border-slate-700">
                    <ShieldCheck size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-300 leading-tight">
                        Este chat es auditado. Evitá compartir datos externos para no ser suspendido automáticamente.
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                {loading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-300" /></div>}
                
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                isMe 
                                    ? 'bg-slate-900 text-white rounded-br-none' 
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            }`}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <p className={`text-[9px] mt-1 text-right font-medium ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input / Restriction Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                {isChatActive && !isSuspended ? (
                    <>
                        {errorMsg && (
                            <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold flex items-start gap-2 border border-red-100 animate-in shake duration-300">
                                <AlertTriangle size={14} className="shrink-0" /> 
                                <span>{errorMsg}</span>
                            </div>
                        )}
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input 
                                type="text" 
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    setErrorMsg(null);
                                }}
                                placeholder="Escribí un mensaje..." 
                                className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                            <button 
                                type="submit" 
                                disabled={!newMessage.trim()}
                                className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:grayscale shadow-lg active:scale-90 transition-transform"
                            >
                                <Send size={20} className={newMessage.trim() ? "translate-x-0.5" : ""} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                        <Lock size={20} className={`mx-auto ${isSuspended ? 'text-red-500' : 'text-slate-400'} mb-2`} />
                        <p className={`text-xs font-bold ${isSuspended ? 'text-red-600' : 'text-slate-600'}`}>
                            {isSuspended ? 'ACCESO RESTRINGIDO' : 'Chat Cerrado'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {isSuspended ? 'Has violado los términos de uso reiteradamente.' : 'Esta conversación ha sido archivada por seguridad.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
