
import React, { useState } from 'react';
import { AddressAutocomplete } from '../components/map/AddressAutocomplete';
import { GoogleMapsProvider } from '../components/map/GoogleMapsProvider';
import { GeoLocation, JobStatus, ServiceRequest, UserRole } from '../types';
import { CameraCapture } from '../components/CameraCapture';
import { ChatWindow } from '../components/ChatWindow';
import { 
  Loader2, CheckCircle, Clock, AlertTriangle, 
  Ruler, Gauge, Info, CameraOff,
  ShieldCheck, ArrowRight, Layers, Scale, History, MessageSquare
} from 'lucide-react';

// APOLLO & GRAPHQL
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { ESTIMATE_SERVICE, CREATE_REQUEST } from '../graphql/queries';
import InteractiveMap from '@/components/map/InteractiveMap';
import { PlaceGeocodingHandler } from '@/components/map/PlaceGeocodingHandler';
import { formatCurrency } from '../../../../services/mockBackend';

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

  const estimate = estimateData?.estimateJob;

  // Added missing function to handle step transition and AI estimation
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
                    
                    {/* Header de Estado */}
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

                    {/* Alerta de Disputa Activa */}
                    {isDisputed && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6 animate-in zoom-in duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale className="text-red-600" size={18} />
                                <h3 className="font-bold text-red-900 text-sm">Servicio en Disputa</h3>
                            </div>
                            <p className="text-xs text-red-700 mb-3 leading-tight">
                                Has reportado una disconformidad. El soporte está revisando las fotos del "antes" y "después". El pago se encuentra retenido.
                            </p>
                            <div className="p-3 bg-white/50 rounded-lg text-[11px] text-red-800 italic">
                                " {activeRequest.dispute?.reason} "
                            </div>
                        </div>
                    )}

                    {/* Resolución de Disputa */}
                    {isResolved && (
                        <div className="bg-slate-900 text-white p-5 rounded-3xl mb-6 shadow-xl animate-in fade-in slide-in-from-top-4">
                             <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="text-green-400" size={20} />
                                <h3 className="font-bold">Disputa Resuelta</h3>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-xs opacity-70">
                                    <span>Resolución:</span>
                                    <span className="font-bold uppercase">{activeRequest.dispute?.resolution}</span>
                                </div>
                                <p className="text-sm leading-relaxed">{activeRequest.dispute?.resolutionComment}</p>
                            </div>
                            <button onClick={() => onConfirmCompletion(activeRequest.id)} className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-xs">Cerrar Orden</button>
                        </div>
                    )}

                    {/* Aprobación del Cliente / Botón Disputa */}
                    {activeRequest.status === JobStatus.PENDING_CLIENT_APPROVAL && !showDisputeForm && (
                        <div className="mb-6 space-y-4 animate-in zoom-in duration-300">
                             <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-amber-900 text-sm">¿Cómo quedó el trabajo?</h3>
                                    <button 
                                        onClick={() => setViewMode(viewMode === 'GALERIA' ? 'COMPARATIVA' : 'GALERIA')}
                                        className="text-[9px] bg-white border border-amber-300 px-2 py-1 rounded-lg flex items-center gap-1 font-bold text-amber-700"
                                    >
                                        <Layers size={10} /> {viewMode === 'GALERIA' ? 'Ver Galería' : 'Comparar'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="relative">
                                        <img src={activeRequest.gardenImageBefore} className="h-28 w-full object-cover rounded-xl grayscale" />
                                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">Antes</span>
                                    </div>
                                    <div className="relative">
                                        <img src={activeRequest.gardenImageAfter} className="h-28 w-full object-cover rounded-xl border-2 border-green-400" />
                                        <span className="absolute bottom-2 left-2 bg-green-600 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">Después</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => setShowDisputeForm(true)} className="flex-1 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1">
                                        <AlertTriangle size={14}/> Reportar
                                    </button>
                                    <button onClick={() => onConfirmCompletion(activeRequest.id)} className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                                        Confirmar Pago
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Formulario de Disputa */}
                    {showDisputeForm && (
                        <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 animate-in slide-in-from-bottom-4">
                            <h3 className="font-black text-red-800 text-sm mb-4 uppercase">¿Cuál fue el problema?</h3>
                            <textarea 
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                placeholder="Ej: No cortó el sector de atrás, dejó restos de pasto..."
                                className="w-full p-4 bg-white rounded-xl border border-red-200 text-sm h-32 mb-4 focus:ring-2 focus:ring-red-500 outline-none"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setShowDisputeForm(false)} className="flex-1 py-3 font-bold text-xs text-red-800">Cancelar</button>
                                <button 
                                    disabled={!disputeReason.trim()}
                                    onClick={() => {
                                        // Aquí llamarías a una mutación DISPUTE_JOB
                                        alert("Disputa iniciada. Soporte revisará el caso.");
                                        setShowDisputeForm(false);
                                    }}
                                    className="flex-[2] py-3 bg-red-600 text-white font-bold rounded-xl text-xs"
                                >
                                    Enviar a Revisión
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Referencia de Detalles */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumen del servicio</p>
                            <History size={14} className="text-slate-300" />
                        </div>
                        <div className="flex gap-3 items-start">
                             <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                                {activeRequest.gardenImageBefore ? <img src={activeRequest.gardenImageBefore} className="w-full h-full object-cover" /> : <CameraOff size={16} />}
                             </div>
                             <div>
                                <h4 className="text-xs font-bold text-slate-800">{activeRequest.squareMeters} m² • {activeRequest.estimatedHours} hs estimadas</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 italic">"{activeRequest.description || "Sin notas adicionales."}"</p>
                             </div>
                        </div>
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
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                                    <ShieldCheck size={10}/> RECOMENDADO
                                </span>
                            </div>

                            <CameraCapture 
                                onCapture={setImage} 
                                initialImage={image} 
                                label="Subí una foto del jardín" 
                            />
                            
                            {!image && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                                    <Info className="text-blue-500 shrink-0" size={18}/>
                                    <p className="text-[11px] text-blue-700 leading-tight">
                                        Subir una foto permite que la IA calcule un precio más justo y evita disputas si el trabajo no queda como querías.
                                    </p>
                                </div>
                            )}
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
                                    placeholder="Ej: Hay un perro amigable, cuidado con los rosales..."
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
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Tarifa de Servicio</span>
                                    <span className="font-bold">{formatCurrency(estimate.price.platformFee)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Impuestos</span>
                                    <span className="font-bold">{formatCurrency(estimate.price.taxes)}</span>
                                </div>
                                
                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <span className="font-bold text-slate-900">Total Final</span>
                                    <span className="font-black text-2xl text-green-600">{formatCurrency(estimate.price.total)}</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-8">
                                <h4 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1">
                                    <Info size={14}/> Análisis de la IA
                                </h4>
                                <p className="text-xs text-blue-700 leading-relaxed italic">
                                    "{estimate.reasoning}"
                                </p>
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
