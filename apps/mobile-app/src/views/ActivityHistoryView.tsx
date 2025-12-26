import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_JOB_HISTORY, SUBMIT_REVIEW, CREATE_TICKET } from '../graphql/queries';
import { JobStatus, ServiceRequest, ResolutionType, UserRole } from '../types';


import { 
    Calendar, CheckCircle, AlertTriangle, ShieldCheck, 
    ChevronRight, Download, MessageSquare, AlertOctagon, Clock 
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../../services/mockBackend';
import { StarRating } from '@/components/StarRating';

interface ActivityHistoryViewProps {
    jobId: string;
    currentUserRole: UserRole;
    onBack: () => void;
}

export const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({ jobId, currentUserRole, onBack }) => {
    const { data, loading, refetch } = useQuery<any>(GET_JOB_HISTORY, { variables: { jobId } });
    
    // Review State
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitReview, { loading: submittingReview }] = useMutation(SUBMIT_REVIEW);

    // Support Ticket State
    const [showReportModal, setShowReportModal] = useState(false);
    const [ticketCategory, setTicketCategory] = useState('QUALITY');
    const [ticketDesc, setTicketDesc] = useState('');
    const [createTicket, { loading: submittingTicket }] = useMutation(CREATE_TICKET);

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin"/></div>;
    
    const job = data?.getJobHistory;
    if (!job) return <div>Error al cargar historial.</div>;

    const isClient = currentUserRole === UserRole.CLIENT;
    const warrantyActive = job.warrantyExpiresAt && new Date(job.warrantyExpiresAt).getTime() > Date.now();
    const warrantyDate = job.warrantyExpiresAt ? new Date(job.warrantyExpiresAt).toLocaleDateString() : '-';

    const handleReview = async () => {
        try {
            await submitReview({ variables: { jobId, rating, comment } });
            refetch();
        } catch (e) { alert("Error al enviar calificación"); }
    };

    const handleReport = async () => {
        try {
            await createTicket({ variables: { jobId, category: ticketCategory, subject: `Reporte Post-Venta: ${ticketCategory}`, description: ticketDesc } });
            setShowReportModal(false);
            refetch();
            alert("Reporte enviado. Soporte te contactará en breve.");
        } catch (e) { alert("Error al crear reporte"); }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative animate-in slide-in-from-right">
            {/* Navbar */}
            <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-4 z-10">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="rotate-180" size={20}/></button>
                <h1 className="font-bold text-lg">Detalle del Servicio</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Header Status */}
                <div className="flex justify-between items-start">
                    <div>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {job.status}
                        </span>
                        <p className="text-xs text-slate-400 mt-2 font-mono">ID: #{job.id.slice(0,8)}</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                            {new Date(job.completedAt).toLocaleDateString()} • {new Date(job.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(job.price.total)}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Total Final</p>
                    </div>
                </div>

                {/* Evidence Gallery (Immutable Snapshot) */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                        <ShieldCheck size={14}/> Evidencia Digital (Blockchain Ready)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">ANTES</span>
                            <img src={job.gardenImageBefore} className="w-full h-32 object-cover rounded-xl bg-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold bg-green-100 px-2 py-1 rounded text-green-700">DESPUÉS</span>
                            <img src={job.gardenImageAfter} className="w-full h-32 object-cover rounded-xl bg-slate-200 border-2 border-green-500" />
                        </div>
                    </div>
                    {job.evidenceImages && job.evidenceImages.length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                            {job.evidenceImages.map((img: string, i: number) => (
                                <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Review Section */}
                {isClient && !job.myReview && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 text-center">
                        <h3 className="font-bold text-slate-800 mb-2">Calificá el trabajo</h3>
                        <p className="text-xs text-slate-500 mb-4">Tu opinión desbloquea la reputación del cortador.</p>
                        <div className="flex justify-center mb-4">
                            <StarRating rating={rating} setRating={setRating} size={32} />
                        </div>
                        <textarea 
                            className="w-full bg-slate-50 p-3 rounded-xl text-sm mb-4 outline-none focus:ring-2 focus:ring-green-500" 
                            placeholder="¿Algún comentario extra?"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                        <button 
                            disabled={rating === 0 || submittingReview}
                            onClick={handleReview}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                        >
                            {submittingReview ? "Enviando..." : "Enviar Calificación"}
                        </button>
                    </div>
                )}

                {job.myReview && (
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-4">
                        <div className="bg-white p-2 rounded-full shadow-sm">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-green-800">¡Gracias por calificar!</p>
                            <div className="flex gap-1 mt-1">
                                <StarRating rating={job.myReview.rating} size={12} readonly />
                            </div>
                        </div>
                    </div>
                )}

                {/* Warranty & Support Section */}
                {isClient && (
                    <div className="space-y-3">
                        {warrantyActive ? (
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Garantía Activa</p>
                                    <p className="text-xs text-blue-800">Cubre rectificaciones hasta el <strong>{warrantyDate}</strong></p>
                                </div>
                                <ShieldCheck className="text-blue-500" size={24} />
                            </div>
                        ) : (
                            <div className="bg-slate-100 p-4 rounded-2xl flex justify-between items-center opacity-70">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Garantía Expirada</p>
                                    <p className="text-xs text-slate-600">Finalizó el {warrantyDate}</p>
                                </div>
                                <ShieldCheck className="text-slate-400" size={24} />
                            </div>
                        )}

                        {warrantyActive && !job.activeTicket && (
                            <button 
                                onClick={() => setShowReportModal(true)}
                                className="w-full py-4 border border-red-200 text-red-600 font-bold rounded-xl text-sm flex items-center justify-center gap-2 bg-white hover:bg-red-50 transition-colors"
                            >
                                <AlertTriangle size={18} /> Reportar un Problema
                            </button>
                        )}

                        {job.activeTicket && (
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertOctagon className="text-orange-600" size={18} />
                                    <h4 className="font-bold text-orange-900 text-sm">Ticket #{job.activeTicket.id.slice(0,6)}</h4>
                                </div>
                                <p className="text-xs text-orange-800 mb-2">Estado: <strong>{job.activeTicket.status}</strong></p>
                                <p className="text-[11px] text-orange-700 italic">"{job.activeTicket.description}"</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Financial Breakdown */}
                <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-bold text-slate-800 mb-4 text-sm">Desglose Financiero</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                            <span>Mano de Obra</span>
                            <span>{formatCurrency(job.price.workerNet)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tarifa de Servicio</span>
                            <span>{formatCurrency(job.price.platformFee)}</span>
                        </div>
                         <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">
                            <span>Total Pagado</span>
                            <span>{formatCurrency(job.price.total)}</span>
                        </div>
                    </div>
                    <button className="mt-4 flex items-center gap-2 text-xs font-bold text-green-600 hover:underline">
                        <Download size={14} /> Descargar Factura Fiscal
                    </button>
                </div>
            </div>

            {/* Support Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
                        <h3 className="font-bold text-lg mb-4 text-slate-900">Reportar Incidente</h3>
                        
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Problema</label>
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {['QUALITY', 'DAMAGE', 'BILLING'].map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setTicketCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap border ${ticketCategory === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    {cat === 'QUALITY' ? 'Mala Calidad' : cat === 'DAMAGE' ? 'Daño Propiedad' : 'Cobro'}
                                </button>
                            ))}
                        </div>

                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción Detallada</label>
                        <textarea 
                            value={ticketDesc}
                            onChange={(e) => setTicketDesc(e.target.value)}
                            className="w-full bg-slate-50 p-4 rounded-xl text-sm mb-6 h-32 focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Describí qué pasó..."
                        />

                        <div className="flex gap-3">
                            <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 font-bold text-slate-400">Cancelar</button>
                            <button 
                                onClick={handleReport}
                                disabled={!ticketDesc.trim() || submittingTicket}
                                className="flex-[2] bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg"
                            >
                                {submittingTicket ? "Enviando..." : "Crear Ticket"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};