"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAuth } from "@/app/providers";
import { BECOME_WORKER, GET_SERVICE_CATEGORIES, ADD_MULTIPLE_WORKER_SPECIALTIES } from "@/graphql/queries";
import { Briefcase, CheckCircle, Loader2, Tag, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  iconName: string;
  description?: string;
}

interface SelectedSpecialty {
  categoryId: string;
  categoryName: string;
  experienceYears: number;
}

/**
 * Worker Onboarding Page - Enhanced for Multiple Specialties
 * 
 * Allows CLIENT users to become WORKER
 * - Collects basic information
 * - Multi-select specialties with experience years
 * - Calls becomeWorker mutation
 * - Creates WorkerSpecialty entries with PENDING status
 * - Redirects to worker dashboard
 */
export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { user, refetchUser } = useAuth();
  const [step, setStep] = useState(1); // Step 1: Basic info, Step 2: Specialties
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<SelectedSpecialty[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categoriesData, loading: categoriesLoading } = useQuery<{
    serviceCategories: ServiceCategory[];
  }>(GET_SERVICE_CATEGORIES);

  const [becomeWorkerMutation] = useMutation(BECOME_WORKER);
  const [addSpecialtiesMutation] = useMutation(ADD_MULTIPLE_WORKER_SPECIALTIES);

  // Redirect if already a worker
  React.useEffect(() => {
    if (user?.role === 'WORKER' || user?.role === 'ADMIN') {
      router.push('/worker/dashboard');
    }
  }, [user, router]);

  const categories = categoriesData?.serviceCategories || [];

  const toggleSpecialty = (category: ServiceCategory) => {
    const exists = selectedSpecialties.find(s => s.categoryId === category.id);
    
    if (exists) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s.categoryId !== category.id));
    } else {
      setSelectedSpecialties([
        ...selectedSpecialties,
        {
          categoryId: category.id,
          categoryName: category.name,
          experienceYears: 0,
        }
      ]);
    }
  };

  const updateExperience = (categoryId: string, years: number) => {
    setSelectedSpecialties(
      selectedSpecialties.map(s => 
        s.categoryId === categoryId 
          ? { ...s, experienceYears: Math.max(0, years) }
          : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      // Validate step 1
      if (!name.trim()) {
        toast.error("Por favor ingresa tu nombre");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 validation
    if (selectedSpecialties.length === 0) {
      toast.error("Por favor selecciona al menos un oficio");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, become a worker
      await becomeWorkerMutation({
        variables: {
          input: {
            name: name.trim(),
            bio: bio.trim() || undefined,
            trade: selectedSpecialties[0].categoryName, // Legacy field
            termsAccepted: true,
          },
        },
      });

      // Then add specialties
      const { data: specialtiesData } = await addSpecialtiesMutation({
        variables: {
          input: {
            specialties: selectedSpecialties.map(s => ({
              categoryId: s.categoryId,
              experienceYears: s.experienceYears,
              metadata: undefined,
            }))
          }
        }
      });

      // Handle specialty addition response
      if (!specialtiesData?.addMultipleWorkerSpecialties?.success) {
        const error = specialtiesData?.addMultipleWorkerSpecialties?.error || "Error al agregar especialidades";
        toast.error(error);
        setIsSubmitting(false);
        return;
      }

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

  if (categoriesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="mt-4 text-sm text-slate-500">Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto min-h-screen py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-2xl">
          <Briefcase className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">¡Únete como Profesional!</h1>
          <p className="text-sm text-slate-500">
            {step === 1 ? 'Completa tu perfil' : 'Selecciona tus especialidades'}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-2">
        <div className={`flex-1 h-1 rounded-full transition-all ${step >= 1 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
        <div className={`flex-1 h-1 rounded-full transition-all ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {step === 1 ? (
          <>
            {/* Step 1: Basic Information */}
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

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Siguiente: Especialidades
            </button>
          </>
        ) : (
          <>
            {/* Step 2: Select Specialties */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">
                  Selecciona tus Oficios
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedSpecialties.length} seleccionado{selectedSpecialties.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Category Tags */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isSelected = selectedSpecialties.some(s => s.categoryId === category.id);
                  
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleSpecialty(category)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
                        ${isSelected 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                      `}
                    >
                      {isSelected ? <CheckCircle className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Experience Years for Selected Categories */}
              {selectedSpecialties.length > 0 && (
                <div className="flex flex-col gap-3 mt-4">
                  <h4 className="text-sm font-bold text-slate-700">
                    Años de Experiencia
                  </h4>
                  {selectedSpecialties.map((specialty) => (
                    <div key={specialty.categoryId} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                      <button
                        type="button"
                        onClick={() => toggleSpecialty({ id: specialty.categoryId } as ServiceCategory)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-sm font-medium text-slate-700">
                        {specialty.categoryName}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateExperience(specialty.categoryId, specialty.experienceYears - 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-bold text-slate-900">
                          {specialty.experienceYears}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateExperience(specialty.categoryId, specialty.experienceYears + 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              disabled={isSubmitting || selectedSpecialties.length === 0}
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

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="w-full py-3 text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              Volver
            </button>
          </>
        )}

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
