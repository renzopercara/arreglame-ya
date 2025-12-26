import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Clock, Camera, Send, X } from 'lucide-react';

// --- DEFINICIONES LOCALES (Simulando ../types.ts) ---
enum JobStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

enum UserRole {
  WORKER = 'WORKER',
  CLIENT = 'CLIENT'
}

enum ExtraTimeStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED'
}

// --- COMPONENTES SIMULADOS (Para que compile en Preview) ---

// Simulación de LeafletMap cargado dinámicamente
export const LeafletMap: React.FC<any> = ({ center }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadLeaflet = async () => {
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = () => initMap();
      } else {
        initMap();
      }
    };

    const initMap = () => {
      const L = (window as any).L;
      if (containerRef.current && !containerRef.current.innerHTML) {
        const map = L.map(containerRef.current, { zoomControl: false }).setView([center.lat, center.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([center.lat, center.lng]).addTo(map);
      }
    };

    loadLeaflet();
  }, [center]);

  return <div ref={containerRef} className="w-full h-full bg-slate-200" />;
};

// Simulación de EvidenceUploader
const EvidenceUploader: React.FC<any> = ({ onComplete, isSubmitting }) => (
  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50">
    <div className="bg-white p-4 rounded-full shadow-sm text-slate-400">
      <Camera size={32} />
    </div>
    <p className="text-sm font-medium text-slate-600">Subir foto del trabajo terminado</p>
    <button 
      onClick={() => onComplete(['https://via.placeholder.com/400'])}
      disabled={isSubmitting}
      className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold disabled:opacity-50"
    >
      {isSubmitting ? 'Enviando...' : 'Simular Captura'}
    </button>
  </div>
);

// Simulación de ChatWindow
const ChatWindow: React.FC<any> = () => (
  <div className="fixed bottom-20 right-4 z-[500]">
    <button className="bg-slate-900 text-white p-4 rounded-full shadow-xl">
      <Send size={24} />
    </button>
  </div>
);

// --- VISTA PRINCIPAL ---

export const App: React.FC<any> = () => {
  // Datos de prueba para la previsualización
  const [worker] = useState({ id: 'w1', location: { lat: -34.6037, lng: -58.3816 } });
  const [activeRequest, setActiveRequest] = useState<any>({
    id: 'job_123',
    status: JobStatus.ASSIGNED,
    location: { lat: -34.6037, lng: -58.3816 },
    extraTimeStatus: ExtraTimeStatus.NONE
  });

  const [pinInput, setPinInput] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [showExtraTimeModal, setShowExtraTimeModal] = useState(false);
  const [extraTimeMinutes, setExtraTimeMinutes] = useState(30);

  const handleArrive = () => {
    setActiveRequest({ ...activeRequest, status: JobStatus.ASSIGNED });
    console.log("Arrived at location");
  };

  const handleStartJob = () => {
    if (pinInput === '1234') {
        setActiveRequest({ ...activeRequest, status: JobStatus.IN_PROGRESS });
    } else {
        alert("PIN Incorrecto (Usa 1234 para la demo)");
    }
  };

  const handleCompleteJob = (id: string, evidence: string) => {
    setActiveRequest(null);
    alert("¡Trabajo finalizado con éxito!");
  };

  if (!activeRequest) return <div className="p-10 text-center text-slate-400 font-medium">No tienes órdenes activas en este momento.</div>;

  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden font-sans">
      {/* Mapa */}
      <div className="h-1/3 relative">
        <LeafletMap center={activeRequest.location} />
        <div className="absolute bottom-4 right-4 z-[400]">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center gap-2 transition-all">
            <Navigation size={20} /> 
            <span className="text-sm font-bold">Navegar</span>
          </button>
        </div>
      </div>

      {/* Panel de Control */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-6 z-10 shadow-[0_-8px_30px_rgb(0,0,0,0.1)] flex flex-col p-6 overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
        
        {activeRequest.status === JobStatus.ASSIGNED && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900">En Camino</h2>
                <p className="text-slate-500 text-sm">Destino: Calle Falsa 123</p>
              </div>
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Prioritario
              </div>
            </div>

            <button 
              onClick={handleArrive} 
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              Marcar Llegada
            </button>
            
            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
              <p className="text-orange-900 text-[10px] font-black mb-3 uppercase tracking-widest text-center">Validar PIN del Cliente</p>
              <div className="flex justify-center mb-4">
                <input 
                  type="text" 
                  maxLength={4} 
                  className="w-32 text-center text-4xl font-mono p-2 border-b-4 border-orange-300 bg-transparent focus:outline-none text-orange-900" 
                  value={pinInput} 
                  onChange={(e) => setPinInput(e.target.value)} 
                  placeholder="0000" 
                />
              </div>
              <button 
                onClick={handleStartJob}
                disabled={pinInput.length !== 4} 
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-md disabled:opacity-50 transition-all uppercase text-sm tracking-bold"
              >
                Iniciar Trabajo
              </button>
            </div>
          </div>
        )}

        {activeRequest.status === JobStatus.IN_PROGRESS && (
          <div className="flex flex-col flex-1 space-y-5">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Trabajo en Curso</h2>
                <p className="text-slate-500 text-sm">Limpieza profunda de alfombras</p>
              </div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                Activo
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl flex justify-between items-center shadow-inner">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiempo Restante</p>
                <p className="text-3xl font-mono font-black text-white">00:44:59</p>
              </div>
              <button 
                onClick={() => setShowExtraTimeModal(true)} 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors"
              >
                + Solicitar Tiempo
              </button>
            </div>

            {activeRequest.extraTimeStatus === ExtraTimeStatus.PENDING && (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3 animate-pulse">
                <div className="bg-blue-600 p-2 rounded-full text-white">
                  <Clock size={16} />
                </div>
                <p className="text-xs text-blue-800 font-bold">El cliente está revisando tu solicitud de tiempo extra...</p>
              </div>
            )}

            <EvidenceUploader 
              onComplete={async (evidence: string[]) => {
                setIsFinishing(true);
                setTimeout(() => {
                  handleCompleteJob(activeRequest.id, evidence[0]);
                  setIsFinishing(false);
                }, 1500);
              }} 
              isSubmitting={isFinishing} 
            />
          </div>
        )}
      </div>

      {/* Modal de Tiempo Extra */}
      {showExtraTimeModal && (
        <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowExtraTimeModal(false)} />
          <div className="bg-white w-full max-w-sm rounded-t-[40px] sm:rounded-[32px] p-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">Más Tiempo</h3>
              <button onClick={() => setShowExtraTimeModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-500 text-sm mb-6">¿Cuánto tiempo adicional necesitas para finalizar el servicio correctamente?</p>
            
            <div className="flex gap-3 mb-6">
              {[15, 30, 60].map(m => (
                <button 
                  key={m} 
                  onClick={() => setExtraTimeMinutes(m)} 
                  className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${extraTimeMinutes === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  {m}m
                </button>
              ))}
            </div>
            
            <textarea 
              placeholder="Explica brevemente el motivo..."
              className="w-full p-4 bg-slate-50 rounded-2xl mb-8 text-sm h-28 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-transparent focus:border-blue-500 transition-all"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setActiveRequest({...activeRequest, extraTimeStatus: ExtraTimeStatus.PENDING});
                  setShowExtraTimeModal(false);
                }} 
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatWindow />
    </div>
  );
};

export default App;