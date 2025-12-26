
import React, { useState } from 'react';
import { JobStatus, WorkerStatus, UserRole } from '../types';
import { ChatWindow } from '../components/ChatWindow';
import { EvidenceUploader } from '../components/EvidenceUploader';
import { Navigation, Clock, Loader2, Info, ExternalLink, Scale, ShieldAlert, MessageSquare } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client/react';
import { ARRIVE_AT_LOCATION, START_JOB, COMPLETE_JOB } from '../graphql/queries';
import { LeafletMap } from '../../../../components/LeafletMap';

export const WorkerView: React.FC<any> = ({ worker, activeRequest, onUpdateStatus, onCompleteJob }) => {
    const [pinInput, setPinInput] = useState('');
    const [isFinishing, setIsFinishing] = useState(false);
    const [showFullBefore, setShowFullBefore] = useState(false);

    const [arriveBackend] = useMutation(ARRIVE_AT_LOCATION);
    const [startBackend] = useMutation(START_JOB);
    const [completeBackend] = useMutation<any>(COMPLETE_JOB);

    if (activeRequest) {
        const isDisputed = activeRequest.status === JobStatus.DISPUTED || activeRequest.status === JobStatus.UNDER_REVIEW;
        const isResolved = activeRequest.status === JobStatus.RESOLVED;

        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="h-2/5 relative">
                     <LeafletMap center={activeRequest.location} markerPosition={activeRequest.location} interactive={true} />
                     <div className="absolute bottom-4 right-4 z-[400]">
                        <button className="bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2"><Navigation size={20} /> Navegar</button>
                     </div>
                </div>

                <div className="flex-1 bg-white flex flex-col p-6 overflow-y-auto">
                    
                    {/* UI de Disputa para el Trabajador */}
                    {isDisputed && (
                        <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-3xl mb-6 shadow-sm animate-in zoom-in">
                            <div className="flex items-center gap-3 mb-3">
                                <ShieldAlert className="text-amber-600" size={24} />
                                <h3 className="font-black text-amber-900 uppercase tracking-tighter">Trabajo Reportado</h3>
                            </div>
                            <p className="text-xs text-amber-800 leading-relaxed mb-4">
                                El cliente ha iniciado una disputa indicando disconformidad. El cobro está pausado hasta que soporte revise las fotos enviadas.
                            </p>
                            <div className="bg-white/60 p-3 rounded-xl border border-amber-100 mb-4">
                                <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Motivo del Cliente</p>
                                <p className="text-xs italic text-amber-900">"{activeRequest.dispute?.reason || "Sin especificar"}"</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                                <Clock size={12} /> Revisión en curso (Est. 24hs)
                            </div>
                        </div>
                    )}

                    {isResolved && (
                        <div className="bg-slate-900 text-white p-5 rounded-3xl mb-6 shadow-xl animate-in slide-in-from-top-4">
                             <div className="flex items-center gap-2 mb-3">
                                <Scale className="text-green-400" size={20} />
                                <h3 className="font-bold">Resolución de Disputa</h3>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl mb-4">
                                <div className="flex justify-between text-[10px] uppercase font-bold mb-2 opacity-60">
                                    <span>Resultado:</span>
                                    <span>{activeRequest.dispute?.resolution}</span>
                                </div>
                                <p className="text-sm leading-relaxed">{activeRequest.dispute?.resolutionComment}</p>
                            </div>
                            <p className="text-[10px] text-center opacity-40">Esta resolución es definitiva y afecta tu reputación.</p>
                        </div>
                    )}

                    <div className="mb-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Guía Visual de Trabajo</p>
                        <div 
                            onClick={() => setShowFullBefore(true)}
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                            <div className="w-20 h-20 bg-slate-200 rounded-xl overflow-hidden shadow-inner flex-shrink-0 relative">
                                {activeRequest.gardenImageBefore ? (
                                    <img src={activeRequest.gardenImageBefore} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-100">
                                        <Info size={16}/>
                                        <span className="text-[8px] font-bold">SIN FOTO</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm">{activeRequest.squareMeters} m² de jardín</h4>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1 italic">"{activeRequest.description || "Sin observaciones."}"</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded uppercase">Dificultad: {activeRequest.difficulty}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeRequest.status === JobStatus.ASSIGNED && (
                        <div className="space-y-4">
                            <button onClick={() => arriveBackend({ variables: { workerId: worker.id, jobId: activeRequest.id, lat: worker.location.lat, lng: worker.location.lng } })} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold">Marcar "Llegué"</button>
                             <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                                <p className="text-orange-900 text-xs font-bold mb-2 uppercase tracking-tighter">Validar PIN del Cliente</p>
                                <div className="flex gap-2">
                                    <input type="text" maxLength={4} className="flex-1 text-center text-3xl font-mono p-2 border-b-2 border-orange-300 bg-transparent mb-4 focus:outline-none focus:border-orange-500" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="0000" />
                                </div>
                                <button onClick={() => startBackend({ variables: { jobId: activeRequest.id, pin: pinInput }})} disabled={pinInput.length !== 4} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">Iniciar Trabajo</button>
                            </div>
                        </div>
                    )}

                    {activeRequest.status === JobStatus.IN_PROGRESS && (
                        <div className="flex flex-col flex-1 space-y-6">
                            <EvidenceUploader 
                                onComplete={async (evidence) => {
                                    setIsFinishing(true);
                                    try {
                                        const { data } = await completeBackend({ variables: { jobId: activeRequest.id, imageAfter: evidence[0], evidenceImages: evidence }});
                                        if (data?.completeJob?.approved) {
                                            onCompleteJob(activeRequest.id, evidence[0]);
                                            onUpdateStatus(activeRequest.id, JobStatus.PENDING_CLIENT_APPROVAL);
                                        } else {
                                            alert(`Error: ${data?.completeJob?.feedback}`);
                                        }
                                    } catch (e) { alert("Error"); } finally { setIsFinishing(false); }
                                }} 
                                isSubmitting={isFinishing} 
                            />
                        </div>
                    )}

                    {activeRequest.status === JobStatus.PENDING_CLIENT_APPROVAL && (
                        <div className="text-center py-10">
                            <Clock className="mx-auto text-amber-500 mb-4 animate-pulse" size={56} />
                            <h2 className="text-xl font-bold text-slate-800">Esperando aprobación</h2>
                            <p className="text-slate-500 text-sm mt-2">El cliente está revisando las fotos enviadas.</p>
                        </div>
                    )}
                </div>

                <ChatWindow 
                    jobId={activeRequest.id} 
                    jobStatus={activeRequest.status}
                    currentUserId={worker.id} 
                    currentUserRole={UserRole.WORKER} 
                    otherUserName={activeRequest.clientName || "Cliente"} 
                    visible={true} 
                    onClose={() => {}} 
                />

                {showFullBefore && activeRequest.gardenImageBefore && (
                    <div className="fixed inset-0 z-[2000] bg-black/95 flex flex-col items-center justify-center p-6" onClick={() => setShowFullBefore(false)}>
                        <p className="text-white text-[10px] font-black uppercase tracking-widest mb-4">Referencia de inicio</p>
                        <img src={activeRequest.gardenImageBefore} className="w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl" />
                        <button className="mt-8 text-white bg-white/10 px-8 py-3 rounded-2xl font-bold">Cerrar</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-100 items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-sm font-bold">Cargando vista...</p>
        </div>
    );
};
