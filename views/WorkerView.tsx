import React, { useState } from 'react';
import { JobStatus, UserRole, ExtraTimeStatus } from '../types.ts';
import { ChatWindow } from '../components/ChatWindow.tsx';
import { LeafletMap } from '../components/LeafletMap.tsx';
import { Navigation, Clock, Camera, CheckCircle2 } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { ARRIVE_AT_LOCATION, START_JOB, COMPLETE_JOB, REQUEST_EXTRA_TIME } from '../graphql/queries.ts';
import { EvidenceUploader } from '../apps/mobile-app/src/components/EvidenceUploader.tsx';

/**
 * Propiedades del componente WorkerView
 */
interface WorkerViewProps {
  worker: any;
  activeRequest: any;
  onUpdateStatus: (id: string, status: string) => void;
  onCompleteJob: (id: string, evidenceUrl: string) => void;
}

export const WorkerView: React.FC<WorkerViewProps> = ({ 
  worker, 
  activeRequest, 
  onUpdateStatus, 
  onCompleteJob 
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [extraTimeMinutes, setExtraTimeMinutes] = useState(30);
  const [extraTimeReason, setExtraTimeReason] = useState('');
  const [showExtraTimeModal, setShowExtraTimeModal] = useState(false);

  // Mutaciones de GraphQL
  const [arriveBackend] = useMutation(ARRIVE_AT_LOCATION);
  const [startBackend] = useMutation(START_JOB);
  const [completeBackend] = useMutation<any>(COMPLETE_JOB);
  const [requestExtraTime] = useMutation(REQUEST_EXTRA_TIME);

  /**
   * Maneja el evento de llegada a la ubicación
   */
  const handleArrive = async () => {
    if (!activeRequest) return;
    try {
      await arriveBackend({ 
        variables: { 
          workerId: worker.id, 
          jobId: activeRequest.id, 
          lat: worker.location.lat, 
          lng: worker.location.lng 
        } 
      });
      onUpdateStatus(activeRequest.id, JobStatus.ASSIGNED);
    } catch (e: any) {
      console.error(e);
      // Nota: En producción usar un componente de notificación en lugar de alert
    }
  };

  /**
   * Maneja la solicitud de tiempo extra
   */
  const handleRequestExtra = async () => {
    if (!activeRequest || !extraTimeReason) return;
    try {
      await requestExtraTime({ 
        variables: { 
          jobId: activeRequest.id, 
          minutes: extraTimeMinutes, 
          reason: extraTimeReason 
        }
      });
      setShowExtraTimeModal(false);
      setExtraTimeReason('');
    } catch (e) {
      console.error("Error al pedir tiempo:", e);
    }
  };

  if (!activeRequest) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
          <Clock className="text-slate-300" size={48} />
        </div>
        <p className="text-slate-500 font-medium text-lg">Sin órdenes activas por el momento</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Sección del Mapa */}
      <div className="h-2/5 relative">
        <LeafletMap 
          center={activeRequest.location} 
          markerPosition={activeRequest.location} 
          interactive={true} 
        />
        <div className="absolute bottom-4 right-4 z-[400]">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center gap-2 transition-all active:scale-95">
            <Navigation size={20} />
            <span className="font-bold text-sm">Navegar</span>
          </button>
        </div>
      </div>

      {/* Panel de Control Inferior */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-6 z-10 flex flex-col p-6 overflow-y-auto shadow-2xl">
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

        {/* Estado: ASIGNADO (En camino o esperando inicio) */}
        {activeRequest.status === JobStatus.ASSIGNED && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="text-blue-500" size={24} />
              <h2 className="text-xl font-black text-slate-800">Orden Confirmada</h2>
            </div>
            
            <button 
              onClick={handleArrive} 
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
            >
              Marcar Llegada
            </button>
            
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
              <p className="text-orange-900 text-[10px] font-bold mb-4 uppercase tracking-widest text-center">Validar PIN del Cliente</p>
              <input 
                type="text" 
                maxLength={4} 
                className="w-full text-center text-4xl font-mono p-2 border-b-2 border-orange-300 bg-transparent mb-6 focus:outline-none" 
                value={pinInput} 
                onChange={(e) => setPinInput(e.target.value)} 
                placeholder="0000" 
              />
              <button 
                onClick={() => startBackend({ variables: { jobId: activeRequest.id, pin: pinInput }})} 
                disabled={pinInput.length !== 4} 
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 shadow-md active:scale-95 transition-all"
              >
                Iniciar Trabajo
              </button>
            </div>
          </div>
        )}

        {/* Estado: EN PROGRESO */}
        {activeRequest.status === JobStatus.IN_PROGRESS && (
          <div className="flex flex-col flex-1 space-y-4">
            <div className="bg-slate-900 p-5 rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tiempo Restante</p>
                <p className="text-2xl font-black text-white">00:45:00</p>
              </div>
              <button 
                onClick={() => setShowExtraTimeModal(true)} 
                className="px-3 py-2 bg-white/10 text-white border border-white/20 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors"
              >
                + Tiempo
              </button>
            </div>

            {activeRequest.extraTimeStatus === ExtraTimeStatus.PENDING && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3 animate-pulse">
                <Clock size={18} className="text-blue-600"/>
                <p className="text-xs text-blue-700 font-bold">Solicitud de tiempo extra enviada...</p>
              </div>
            )}

            <div className="flex-1">
              <EvidenceUploader 
                onComplete={async (evidence) => {
                  setIsFinishing(true);
                  try {
                    const { data } = await completeBackend({ 
                      variables: { 
                        jobId: activeRequest.id, 
                        imageAfter: evidence[0] 
                      }
                    });
                    if (data?.completeJob?.approved) onCompleteJob(activeRequest.id, evidence[0]);
                  } catch (e) {
                    console.error("Error al completar:", e);
                  } finally {
                    setIsFinishing(false);
                  }
                }} 
                isSubmitting={isFinishing} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal para solicitar Tiempo Extra */}
      {showExtraTimeModal && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-xl font-bold mb-4 text-slate-800">¿Necesitás más tiempo?</h3>
            
            <div className="flex gap-2 mb-4">
              {[15, 30, 60].map(m => (
                <button 
                  key={m} 
                  onClick={() => setExtraTimeMinutes(m)} 
                  className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                    extraTimeMinutes === m 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-100 text-slate-400'
                  }`}
                >
                  +{m} min
                </button>
              ))}
            </div>

            <textarea 
              value={extraTimeReason}
              onChange={(e) => setExtraTimeReason(e.target.value)}
              placeholder="Explicación para el cliente..."
              className="w-full p-4 bg-slate-50 rounded-xl mb-6 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-100 border-none resize-none"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setShowExtraTimeModal(false)} 
                className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRequestExtra} 
                disabled={!extraTimeReason}
                className="flex-[2] bg-slate-900 text-white py-3 px-6 rounded-xl font-bold shadow-lg disabled:opacity-50 active:scale-95 transition-all"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ventana de Chat Flotante */}
      <ChatWindow 
        jobId={activeRequest.id} 
        jobStatus={activeRequest.status}
        currentUserId={worker.id} 
        currentUserRole={UserRole.WORKER} 
        otherUserName="Cliente" 
        visible={true} 
        onClose={() => {}} 
      />
    </div>
  );
};