
import React, { useState } from 'react';
import { GeoLocation, JobStatus, ServiceRequest, UserRole, ExtraTimeStatus } from '../types.ts';
import { formatCurrency } from '../services/billingService.ts';
import { ChatWindow } from '../components/ChatWindow.tsx';
import { 
  Loader2, CheckCircle, Clock, AlertTriangle, 
  Ruler, Gauge, Info, CameraOff,
  ShieldCheck, ArrowRight, Layers, Scale, History, MessageSquare, X, Check 
} from 'lucide-react';

// APOLLO & GRAPHQL
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { ESTIMATE_SERVICE, CREATE_REQUEST, RESPOND_TO_EXTRA_TIME } from '../graphql/queries.ts';
import InteractiveMap from '../apps/mobile-app/src/components/map/InteractiveMap.tsx';
import { GoogleMapsProvider } from '../apps/mobile-app/src/components/map/GoogleMapsProvider.tsx';
import { AddressAutocomplete } from '../apps/mobile-app/src/components/map/AddressAutocomplete.tsx';
import { CameraCapture } from '../apps/mobile-app/src/components/CameraCapture.tsx';
import { PlaceGeocodingHandler } from '../apps/mobile-app/src/components/map/PlaceGeocodingHandler.tsx';

export const ClientView: React.FC<any> = ({ currentUser, activeRequest, onRequestCreate, onConfirmCompletion }) => {
  const [wizardStep, setWizardStep] = useState(0); 
  const [location, setLocation] = useState<GeoLocation>({ lat: -34.6037, lng: -58.3816 });
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [squareMeters, setSquareMeters] = useState<number | ''>('');
  const [difficultyLevel, setDifficultyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [observations, setObservations] = useState('');
  const [image, setImage] = useState<string | null>(null);
  
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [viewMode, setViewMode] = useState<'GALERIA' | 'COMPARATIVA'>('COMPARATIVA');

  const [estimateService, { loading: isAnalyzing, data: estimateData }] = useLazyQuery<any>(ESTIMATE_SERVICE);
  const [createRequestBackend, { loading: isCreating }] = useMutation<any>(CREATE_REQUEST);
  const [respondToExtraTime] = useMutation(RESPOND_TO_EXTRA_TIME);

  const estimate = estimateData?.estimateJob;

  const handleContinueToEstimate = () => {
    setWizardStep(2);
    estimateService({ 
      variables: { 
        image: image || "", 
        description: observations,
        squareMeters: Number(squareMeters),
        hasHighWeeds: false,
        hasSlope: false,
        complicatedAccess: false
      }
    });
  };

  if (activeRequest) {
      const isDisputed = activeRequest.status === JobStatus.DISPUTED || activeRequest.status === JobStatus.UNDER_REVIEW;
      const isResolved = activeRequest.status === JobStatus.RESOLVED;

      return (
        <GoogleMapsProvider>
           <div className="flex flex-col h-full bg-slate-50">
                <div className="h-1/2 relative">
                    <InteractiveMap initialCenter={activeRequest.location} />
                </div>
                <div className="flex-1 bg-white rounded-t-3xl -mt-6 z-10 p-6 flex flex-col shadow-2xl overflow-y-auto">
                    <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 shrink-0"></div>
                    
                    {activeRequest.extraTimeStatus === ExtraTimeStatus.PENDING && (
                        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-300">
                            <h3 className="font-bold text-amber-900 text-sm mb-1">Pedido de tiempo extra</h3>
                            <p className="text-[11px] text-amber-700 mb-3 italic">"{activeRequest.extraTimeReason}"</p>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-600">+{activeRequest.extraTimeMinutes} min</span>
                                <span className="text-sm font-black text-amber-900">+$2.500 est.</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => respondToExtraTime({ variables: { jobId: activeRequest.id, approved: false }})} className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                    <X size={14}/> Rechazar
                                </button>
                                <button onClick={() => respondToExtraTime({ variables: { jobId: activeRequest.id, approved: true }})} className="flex-2 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                    <Check size={14}/> Aprobar Gasto
                                </button>
                            </div>
                        </div>
                    )}

                    {activeRequest.status === JobStatus.PENDING_CLIENT_APPROVAL && (
                        <div className="mb-4 text-center">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Pago retenido en Escrow</p>
                            <div className="flex items-center justify-center gap-2 mt-1 text-green-600 font-bold text-xs">
                                <Clock size={14}/> <span>Auto-confirmación en 23:54hs</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter 
                                ${isDisputed ? 'bg-red-100 text-red-700' : 
                                  isResolved ? 'bg-slate-100 text-slate-700' : 
                                  activeRequest.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {activeRequest.status.replace('_', ' ')}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">#{activeRequest.id.slice(0,8)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-slate-900">{formatCurrency(activeRequest.price.total)}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 mb-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PIN DE SEGURIDAD</p>
                        <div className="text-4xl font-mono font-bold text-center tracking-[0.5em] py-2 bg-white rounded-xl border border-slate-200">{activeRequest.pin}</div>
                        <p className="text-[9px] text-slate-400 text-center">Entregá este código al cortador para que empiece.</p>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => onConfirmCompletion(activeRequest.id)} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold">Confirmar Finalización</button>
                    </div>
                </div>

                <ChatWindow 
                    jobId={activeRequest.id} 
                    jobStatus={activeRequest.status}
                    currentUserId={currentUser.id} 
                    currentUserRole={UserRole.CLIENT} 
                    otherUserName="Cortador" 
                    visible={true} 
                    onClose={() => {}} 
                />
           </div>
        </GoogleMapsProvider>
      );
  }

  return (
    <GoogleMapsProvider>
    <div className="flex flex-col h-full bg-slate-50 relative">
        <header className="px-6 py-4 bg-white shadow-sm z-20 flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800">Arreglame Ya</h1>
            <div className="flex gap-1">
                {[0, 1, 2].map((s) => (<div key={s} className={`h-1 w-6 rounded-full ${s <= wizardStep ? 'bg-green-500' : 'bg-slate-200'}`} />))}
            </div>
        </header>

        <main className="flex-1 relative overflow-hidden flex flex-col">
            {wizardStep === 0 && (
                <>
                    <div className="absolute inset-0 z-0">
                        <InteractiveMap initialCenter={location} onCenterChange={setLocation} />
                        <PlaceGeocodingHandler placeId={selectedPlaceId} onLocationResolved={setLocation} />
                    </div>
                    <div className="absolute top-4 left-4 right-4 z-10"><AddressAutocomplete onSelect={(id) => setSelectedPlaceId(id)} /></div>
                    <div className="absolute bottom-6 left-6 right-6 z-10 bg-white p-4 rounded-2xl shadow-xl">
                        <button onClick={() => setWizardStep(1)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                            Confirmar Dirección <ArrowRight size={18}/>
                        </button>
                    </div>
                </>
            )}

            {wizardStep === 1 && (
                <div className="flex-1 p-6 bg-white overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="max-w-sm mx-auto space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Estado Inicial</h2>
                                    <p className="text-sm text-slate-500">¿Cómo está tu jardín hoy?</p>
                                </div>
                            </div>

                            <CameraCapture 
                                onCapture={setImage} 
                                initialImage={image} 
                                label="Subí una foto del jardín" 
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Superficie</label>
                                    <div className="relative">
                                        <input type="number" placeholder="m²" value={squareMeters} onChange={(e) => setSquareMeters(Number(e.target.value))} className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-green-500 font-bold" />
                                        <Ruler className="absolute right-4 top-4 text-slate-300" size={18}/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dificultad</label>
                                    <div className="relative">
                                        <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value as any)} className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-green-500 font-bold appearance-none">
                                            <option value="LOW">Baja</option>
                                            <option value="MEDIUM">Media</option>
                                            <option value="HIGH">Alta</option>
                                        </select>
                                        <Gauge className="absolute right-4 top-4 text-slate-300 pointer-events-none" size={18}/>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observaciones</label>
                                <textarea 
                                    placeholder="Ej: Hay un perro amigable..."
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-green-500 text-sm h-24"
                                />
                            </div>
                        </div>

                        <button 
                            disabled={!squareMeters} 
                            onClick={handleContinueToEstimate} 
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            {image ? "Ver Presupuesto IA" : "Continuar sin foto"}
                        </button>
                    </div>
                </div>
            )}

            {wizardStep === 2 && (
                <div className="flex-1 p-6 flex flex-col bg-white animate-in slide-in-from-right duration-300">
                    {isAnalyzing ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-full border-4 border-green-500 border-t-transparent animate-spin mb-6"></div>
                            <h3 className="text-xl font-bold">Analizando...</h3>
                            <p className="text-slate-500 mt-2">Calculando esfuerzo y precio justo con IA.</p>
                        </div>
                    ) : estimate ? (
                        <div className="flex flex-col h-full">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Presupuesto Estimado</h2>
                            
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Mano de Obra ({estimate.estimatedHours}h)</span>
                                    <span className="font-bold">{formatCurrency(estimate.price.workerNet)}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <span className="font-bold text-slate-900">Total Final</span>
                                    <span className="font-black text-2xl text-green-600">{formatCurrency(estimate.price.total)}</span>
                                </div>
                            </div>

                            <div className="mt-auto space-y-3">
                                <button 
                                    disabled={isCreating}
                                    onClick={async () => {
                                        const { data } = await createRequestBackend({
                                            variables: {
                                                clientId: currentUser.id,
                                                lat: location.lat,
                                                lng: location.lng,
                                                image: image || "",
                                                description: observations,
                                                difficulty: estimate.difficultyMultiplier,
                                                estimatedHours: estimate.estimatedHours,
                                                squareMeters: Number(squareMeters),
                                                hasHighWeeds: false
                                            }
                                        });

                                        if (data?.createJob) {
                                            const newReq: ServiceRequest = {
                                                id: data.createJob.id,
                                                clientId: currentUser.id,
                                                status: JobStatus.CREATED,
                                                location,
                                                description: observations,
                                                gardenImageBefore: image || "",
                                                difficulty: estimate.difficultyMultiplier,
                                                estimatedHours: estimate.estimatedHours,
                                                price: estimate.price,
                                                createdAt: Date.now(),
                                                pin: data.createJob.pin
                                            };
                                            onRequestCreate(newReq);
                                        }
                                    }}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2"
                                >
                                    {isCreating ? <Loader2 className="animate-spin"/> : "Confirmar y Buscar"}
                                </button>
                                <button onClick={() => setWizardStep(1)} className="w-full py-2 text-slate-400 font-bold text-sm">Volver a editar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <AlertTriangle size={48} className="text-amber-500 mb-4" />
                            <h3 className="text-lg font-bold">Error al estimar</h3>
                            <button onClick={() => setWizardStep(1)} className="mt-4 text-green-600 font-bold">Reintentar</button>
                        </div>
                    )}
                </div>
            )}
        </main>
    </div>
    </GoogleMapsProvider>
  );
};
