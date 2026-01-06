"use client";

import React, { useState } from "react";
import { 
  X, 
  Briefcase, 
  Shield, 
  CheckCircle, 
  Camera, 
  ChevronRight, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Nota: He integrado mocks de las dependencias externas (@apollo/client, contextos, etc.)
 * para que el componente sea previsualizable de forma inmediata sin errores de resolución.
 * También se ha corregido el error de TypeScript "Property does not exist on type unknown".
 */

// --- INTERFACES Y TIPOS ---

interface WorkerResponse {
  becomeWorker: {
    id: string;
    roles: string[];
  };
}

interface LatestTerms {
  version: string;
  content: string;
}

interface LatestTermsData {
  latestTerms: LatestTerms;
}

interface FormValues {
  name: string;
  bio: string;
  trade: string;
  category: string;
  selfieImage?: string;
  termsAccepted: boolean;
}

// --- SIMULACIÓN DE COMPONENTES Y LOGICA (MOCKS) ---

const LoadingButton = ({ loading, children, className, disabled, type }: any) => (
  <button 
    type={type}
    disabled={loading || disabled}
    className={`${className} flex items-center justify-center gap-2`}
  >
    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
  </button>
);

const useAuth = () => ({
  user: { name: "Usuario de Prueba", roles: ["USER"] },
  refetchUser: async () => new Promise(res => setTimeout(res, 800))
});

const useMutation = <TData,>(query: string): [any, { loading: boolean }] => {
  const [loading, setLoading] = useState(false);
  const mutate = async ({ variables }: any) => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 1500));
    setLoading(false);
    return { data: { becomeWorker: { id: "123", roles: ["USER", "WORKER"] } } as TData };
  };
  return [mutate, { loading }];
};

const useQuery = <TData,>(query: string, options: any) => {
  return {
    data: {
      latestTerms: {
        version: "2024.1",
        content: "Al activar el perfil profesional, usted acepta que la plataforma actúe como intermediario. Se compromete a brindar información verídica, mantener un trato cordial con los clientes y cumplir con las normativas locales vigentes para su oficio. La plataforma se reserva el derecho de verificar sus antecedentes y certificaciones en cualquier momento para garantizar la seguridad de la comunidad."
      }
    } as TData,
    loading: false
  };
};

const TRADE_OPTIONS = [
  { value: "PLOMERO", label: "Plomero" },
  { value: "ELECTRICISTA", label: "Electricista" },
  { value: "JARDINERO", label: "Jardinero" },
  { value: "PINTOR", label: "Pintor" },
  { value: "CARPINTERO", label: "Carpintero" },
  { value: "ALBANIL", label: "Albañil" },
  { value: "TECHISTA", label: "Techista" },
  { value: "OTRO", label: "Otro" },
];

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const { user, refetchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuccessState, setShowSuccessState] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState<FormValues>({
    name: user?.name || "",
    trade: "",
    bio: "",
    category: "MAINTENANCE",
    termsAccepted: false,
    selfieImage: ""
  });

  const { data: termsData } = useQuery<LatestTermsData>("GET_LATEST_TERMS", { skip: !isOpen });
  const [becomeWorkerMutation, { loading }] = useMutation<WorkerResponse>("BECOME_WORKER");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData(prev => ({ ...prev, selfieImage: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Se utiliza el tipo genérico para evitar errores de "unknown"
      const result = await becomeWorkerMutation({
        variables: {
          input: { 
            ...formData, 
            termsVersion: termsData?.latestTerms?.version 
          }
        }
      });

      // Verificación segura de datos
      if (result.data && result.data.becomeWorker) {
        setShowSuccessState(true);
        try {
          await refetchUser();
        } catch (e) {
          console.error("Error al actualizar cache de usuario");
        }
        
        setTimeout(() => {
          setShowSuccessState(false);
          setStep(1);
          setIsOpen(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error en el registro:", error);
    }
  };

  const isStep1Valid = formData.name.length > 2 && formData.trade !== "" && formData.bio.length >= 20;

  if (!isOpen) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <button 
        onClick={() => setIsOpen(true)}
        className="px-8 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-xl hover:bg-green-700 transform hover:-translate-y-1 transition-all"
      >
        Convertirse en Profesional
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {showSuccessState ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="p-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </motion.div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">¡Bienvenido Profesional!</h2>
                <p className="text-slate-600">Tu perfil ha sido activado correctamente. Redirigiendo a tu nuevo panel...</p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-5 border-b flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-green-600 rounded-xl shadow-lg shadow-green-200">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">Mejorar Cuenta</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-1">
                        <div className={`h-1.5 w-6 rounded-full transition-colors ${step >= 1 ? 'bg-green-500' : 'bg-slate-200'}`} />
                        <div className={`h-1.5 w-6 rounded-full transition-colors ${step >= 2 ? 'bg-green-500' : 'bg-slate-200'}`} />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Paso {step} de 2</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
                        <Shield className="w-6 h-6 text-blue-600 shrink-0" />
                        <div className="text-sm text-blue-900">
                          <p className="font-bold uppercase text-[10px] tracking-widest text-blue-500 mb-1">Tu Seguridad</p>
                          <p>Al activarte como profesional, podrás recibir pagos seguros y construir tu reputación con reseñas reales.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nombre Comercial</label>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 outline-none transition-all font-medium"
                            placeholder="Ej: Juan Pérez Plomería"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Oficio Principal</label>
                          <select
                            name="trade"
                            value={formData.trade}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 outline-none transition-all font-medium appearance-none"
                          >
                            <option value="">Selecciona tu oficio...</option>
                            {TRADE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between items-end mb-2 ml-1">
                            <label className="text-sm font-bold text-slate-700">Biografía Profesional</label>
                            <span className={`text-[10px] font-bold ${formData.bio.length < 20 ? 'text-amber-500' : 'text-green-500'}`}>
                              {formData.bio.length}/20 caracteres min.
                            </span>
                          </div>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            required
                            rows={4}
                            className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-green-500 outline-none transition-all font-medium resize-none"
                            placeholder="Cuéntale a tus futuros clientes sobre tu experiencia y forma de trabajo..."
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!isStep1Valid}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        Siguiente paso
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="space-y-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <label className="block text-sm font-bold text-slate-700 mb-4">Verificación Visual</label>
                          <div className="relative group">
                            <input type="file" accept="image/*" onChange={handleImageCapture} className="hidden" id="selfie-upload" />
                            <label
                              htmlFor="selfie-upload"
                              className="flex flex-col items-center justify-center w-48 h-48 border-4 border-dashed border-slate-200 rounded-full cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all overflow-hidden relative shadow-inner bg-slate-50"
                            >
                              {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                  <Camera className="w-10 h-10" />
                                  <span className="text-[10px] font-bold uppercase tracking-tighter px-4">Toca para tu foto</span>
                                </div>
                              )}
                            </label>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">Esta foto ayuda a generar confianza</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-900">
                          <AlertCircle className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-bold">Contrato de Servicios</span>
                        </div>
                        <div className="h-28 overflow-y-auto text-[11px] leading-relaxed text-slate-500 pr-2 scrollbar-thin">
                          {termsData?.latestTerms?.content}
                        </div>
                        <label className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer select-none transition-colors hover:border-green-200 group">
                          <div className="relative flex items-center mt-0.5">
                            <input
                              name="termsAccepted"
                              type="checkbox"
                              checked={formData.termsAccepted}
                              onChange={handleInputChange}
                              className="w-5 h-5 rounded-lg text-green-600 border-slate-300 focus:ring-green-500 transition-all cursor-pointer"
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">
                            Acepto los términos y condiciones de uso profesional y la política de verificación de identidad.
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 py-4 border-2 border-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                        >
                          Atrás
                        </button>
                        <LoadingButton
                          type="submit"
                          loading={loading}
                          disabled={!formData.termsAccepted}
                          className="flex-[2] py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-xl shadow-green-100 transition-all"
                        >
                          Activar Perfil Ahora
                        </LoadingButton>
                      </div>
                    </motion.div>
                  )}
                </form>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}