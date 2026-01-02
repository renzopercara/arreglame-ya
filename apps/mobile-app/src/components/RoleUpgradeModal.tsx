"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client/react";
import { X, Briefcase, Shield, CheckCircle, Camera } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import LoadingButton from "@/components/LoadingButton";
import { BECOME_WORKER, GET_LATEST_TERMS } from "@/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@apollo/client/react";

type FormValues = {
  name: string;
  bio: string;
  trade: string;
  category: string;
  selfieImage?: string;
  termsAccepted: boolean;
};

interface RoleUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

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

export default function RoleUpgradeModal({ isOpen, onClose, onSuccess }: RoleUpgradeModalProps) {
  const { user, refetchUser } = useAuth();
  const [step, setStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: termsData } = useQuery(GET_LATEST_TERMS, {
    variables: { role: "WORKER" },
    skip: !isOpen,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: user?.name || "",
      bio: "",
      trade: "",
      category: "MAINTENANCE",
      termsAccepted: false,
    },
    mode: "onChange",
  });

  const termsAccepted = watch("termsAccepted");
  const trade = watch("trade");

  const [becomeWorkerMutation, { loading }] = useMutation(BECOME_WORKER);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setValue("selfieImage", base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await becomeWorkerMutation({
        variables: {
          input: {
            name: data.name,
            bio: data.bio,
            trade: data.trade,
            category: data.category,
            selfieImage: data.selfieImage,
            termsAccepted: data.termsAccepted,
            termsVersion: termsData?.latestTerms?.version,
          },
        },
      });

      if (result.data?.becomeWorker) {
        await refetchUser();
        toast.success("¡Bienvenido como profesional!");
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      console.error("Error upgrading to worker:", error);
      toast.error(error.message || "Error al activar perfil profesional");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Convertirse en Profesional</h2>
                <p className="text-xs text-slate-500">Paso {step} de 2</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    ¿Qué implica ser profesional?
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                    <li>Recibir solicitudes de trabajo cercanas</li>
                    <li>Gestionar tu disponibilidad y horarios</li>
                    <li>Recibir pagos de forma segura</li>
                    <li>Construir tu reputación profesional</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    {...register("name", { required: "El nombre es obligatorio" })}
                    type="text"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Tu nombre completo"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Oficio / Especialidad *
                  </label>
                  <select
                    {...register("trade", { required: "Selecciona tu oficio" })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecciona una opción</option>
                    {TRADE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.trade && (
                    <p className="text-red-500 text-xs mt-1">{errors.trade.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Bio Profesional *
                  </label>
                  <textarea
                    {...register("bio", {
                      required: "La biografía es obligatoria",
                      minLength: { value: 20, message: "Mínimo 20 caracteres" },
                    })}
                    rows={4}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Describe tu experiencia, certificaciones, años en el rubro..."
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Esta información será visible para los clientes
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!watch("name") || !watch("trade") || !watch("bio")}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Verificación de Identidad (KYC Ligero)
                  </h3>
                  <p className="text-sm text-amber-800">
                    Para proteger a nuestros usuarios, necesitamos una foto de tu rostro. Esto nos
                    ayuda a verificar tu identidad.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Foto de Rostro
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleImageCapture}
                      className="hidden"
                      id="selfie-input"
                    />
                    <label
                      htmlFor="selfie-input"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <Camera className="w-8 h-8" />
                          <span className="text-sm font-medium">Tomar foto o subir imagen</span>
                        </div>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Recomendado pero opcional</p>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-slate-900">Términos y Condiciones</h3>
                  <div className="max-h-32 overflow-y-auto text-xs text-slate-600 bg-slate-50 p-3 rounded">
                    {termsData?.latestTerms?.content || "Cargando términos..."}
                  </div>
                  <label className="flex items-start gap-3">
                    <input
                      {...register("termsAccepted", {
                        required: "Debes aceptar los términos",
                      })}
                      type="checkbox"
                      className="mt-1"
                    />
                    <span className="text-sm text-slate-700">
                      Acepto los términos y condiciones para profesionales *
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className="text-red-500 text-xs">{errors.termsAccepted.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Atrás
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={loading}
                    disabled={!termsAccepted}
                    className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Activar Perfil
                  </LoadingButton>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
