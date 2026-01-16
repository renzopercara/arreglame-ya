"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "@/app/providers";
import { BECOME_WORKER } from "@/graphql/queries";
import { Briefcase, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Worker Onboarding Page
 * 
 * Allows CLIENT users to become WORKER/PROVIDER
 * - Collects basic information
 * - Calls becomeWorker mutation
 * - Updates user role and activeRole
 * - Redirects to worker dashboard
 */
export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { user, refetchUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState("");
  const [trade, setTrade] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [becomeWorkerMutation] = useMutation(BECOME_WORKER);

  // Redirect if already a worker
  React.useEffect(() => {
    if (user?.role === 'WORKER' || user?.role === 'ADMIN') {
      router.push('/worker/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Por favor ingresa tu nombre");
      return;
    }

    if (!trade.trim()) {
      toast.error("Por favor selecciona tu oficio");
      return;
    }

    setIsSubmitting(true);

    try {
      await becomeWorkerMutation({
        variables: {
          input: {
            name: name.trim(),
            bio: bio.trim() || undefined,
            trade: trade,
          },
        },
      });

      // Refetch user data to update the context
      await refetchUser();

      toast.success("¡Felicitaciones! Ahora eres un profesional");
      
      // Redirect to worker dashboard
      setTimeout(() => {
        router.push('/worker/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Error becoming worker:', error);
      toast.error(error.message || "Error al registrarte como profesional");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto min-h-screen py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-2xl">
          <Briefcase className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">¡Únete como Profesional!</h1>
          <p className="text-sm text-slate-500">Completa tu perfil para empezar</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Name Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-bold text-slate-700">
            Nombre Completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
            disabled={isSubmitting}
          />
        </div>

        {/* Trade Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="trade" className="text-sm font-bold text-slate-700">
            Oficio Principal
          </label>
          <select
            id="trade"
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
            disabled={isSubmitting}
          >
            <option value="">Selecciona tu oficio</option>
            <option value="GARDENING">Jardinería</option>
            <option value="PLUMBING">Plomería</option>
            <option value="ELECTRICAL">Electricidad</option>
            <option value="PAINTING">Pintura</option>
            <option value="CARPENTRY">Carpintería</option>
            <option value="CLEANING">Limpieza</option>
            <option value="HVAC">Climatización</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        {/* Bio Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="bio" className="text-sm font-bold text-slate-700">
            Descripción (Opcional)
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Cuéntanos sobre tu experiencia y servicios..."
            rows={4}
            className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm resize-none"
            disabled={isSubmitting}
          />
          <p className="text-xs text-slate-400">
            Ayuda a los clientes a conocerte mejor
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-emerald-900 mb-3">
            Beneficios de ser Profesional
          </h3>
          <ul className="space-y-2">
            {[
              'Recibe solicitudes de clientes en tu zona',
              'Gestiona tus trabajos desde la app',
              'Cobra de forma segura por cada servicio',
              'Aumenta tu reputación con reseñas',
            ].map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-emerald-800">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>PROCESANDO...</span>
            </>
          ) : (
            <>
              <Briefcase className="w-5 h-5" />
              <span>COMENZAR COMO PROFESIONAL</span>
            </>
          )}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={() => router.push('/')}
          disabled={isSubmitting}
          className="w-full py-3 text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}
