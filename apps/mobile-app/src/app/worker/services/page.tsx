"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";
import {
  GET_SERVICE_CATEGORIES,
  GET_MY_SERVICES,
  SYNC_PROFESSIONAL_SERVICES
} from "@/graphql/queries";
import { toast } from "sonner";

// Type definitions
interface ServiceSelectionData {
  experienceYears: number;
  description: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string;
  basePrice: number | string;
  hourlyRate: number | string;
  active: boolean;
}

interface WorkerService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string;
  isActive: boolean;
  experienceYears: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Worker Services Management Page
 * 
 * Allows workers to manage their service catalog:
 * - Select/deselect services they offer
 * - Add experience years for each service
 * - Add custom descriptions for services
 * - Sync changes to database
 */
export default function WorkerServicesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<Map<string, ServiceSelectionData>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch available service categories
  const { data: categoriesData, loading: loadingCategories } = useQuery(GET_SERVICE_CATEGORIES, {
    skip: !isAuthenticated,
  });

  // Fetch worker's current services
  const { data: servicesData, loading: loadingServices, refetch: refetchServices } = useQuery(GET_MY_SERVICES, {
    skip: !isAuthenticated || (user?.role !== 'WORKER' && user?.role !== 'ADMIN'),
    fetchPolicy: 'cache-and-network',
  });

  // Sync professional services mutation
  const [syncServices] = useMutation(SYNC_PROFESSIONAL_SERVICES, {
    onCompleted: () => {
      toast.success('Servicios actualizados correctamente');
      setIsSaving(false);
      setHasChanges(false);
      refetchServices();
    },
    onError: (error) => {
      console.error('Error syncing services:', error);
      toast.error('Error al actualizar los servicios');
      setIsSaving(false);
    },
  });

  // Redirect if not authenticated or not a worker
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (user?.role !== 'WORKER' && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Initialize selected services from current worker services
  useEffect(() => {
    if (servicesData?.getMyServices) {
      const newMap = new Map<string, ServiceSelectionData>();
      servicesData.getMyServices.forEach((service: WorkerService) => {
        // Find the corresponding category ID
        const category = categoriesData?.serviceCategories?.find(
          (cat: ServiceCategory) => cat.name === service.name || cat.slug === service.slug
        );

        if (category) {
          newMap.set(category.id, {
            experienceYears: service.experienceYears || 0,
            description: service.description || '',
          });
        }
      });
      setSelectedServices(newMap);
    }
  }, [servicesData, categoriesData]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const categories: ServiceCategory[] = categoriesData?.serviceCategories || [];
  const isLoading = loadingCategories || loadingServices;

  const handleToggleService = (categoryId: string) => {
    const newMap = new Map(selectedServices);
    if (newMap.has(categoryId)) {
      newMap.delete(categoryId);
    } else {
      newMap.set(categoryId, { experienceYears: 0, description: '' });
    }
    setSelectedServices(newMap);
    setHasChanges(true);
  };

  const handleUpdateExperience = (categoryId: string, years: number) => {
    const newMap = new Map(selectedServices);
    const current = newMap.get(categoryId) || { experienceYears: 0, description: '' };
    newMap.set(categoryId, { ...current, experienceYears: years });
    setSelectedServices(newMap);
    setHasChanges(true);
  };

  const handleUpdateDescription = (categoryId: string, description: string) => {
    const newMap = new Map(selectedServices);
    const current = newMap.get(categoryId) || { experienceYears: 0, description: '' };
    newMap.set(categoryId, { ...current, description });
    setSelectedServices(newMap);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Convert selected services to input format
    const services = Array.from(selectedServices.entries()).map(([categoryId, data]) => ({
      categoryId,
      experienceYears: data.experienceYears,
      description: data.description,
    }));

    try {
      await syncServices({
        variables: {
          input: { services },
        },
      });
    } catch (error) {
      // Error is handled in onError callback
      console.error('Save error:', error);
    }
  };

  const handleCancel = () => {
    router.push('/worker/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mis Servicios</h1>
                <p className="text-sm text-gray-500">Gestiona tu catálogo de servicios</p>
              </div>
            </div>

            {hasChanges && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Cambios sin guardar</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Info Banner */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Selecciona los servicios que ofreces</p>
                  <p className="text-blue-700">
                    Los servicios nuevos quedarán en estado "Pendiente" hasta ser aprobados por un administrador.
                  </p>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="space-y-4">
              {categories.map((category: ServiceCategory) => {
                const isSelected = selectedServices.has(category.id);
                const serviceData = selectedServices.get(category.id);

                return (
                  <div
                    key={category.id}
                    className={`bg-white rounded-xl border-2 transition-all ${isSelected
                        ? 'border-emerald-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {/* Service Header */}
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleToggleService(category.id)}
                          className="flex-shrink-0 mt-1"
                        >
                          {isSelected ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                        </button>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {category.description || 'Sin descripción'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Precio base: ${Number(category.basePrice).toFixed(0)}</span>
                            <span>Tarifa/hora: ${Number(category.hourlyRate).toFixed(0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Options */}
                      {isSelected && (
                        <div className="mt-4 pl-10 space-y-4 border-t border-gray-100 pt-4">
                          {/* Experience Years */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Años de experiencia
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={serviceData?.experienceYears || 0}
                              onChange={(e) => handleUpdateExperience(category.id, parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>

                          {/* Custom Description */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Descripción personalizada (opcional)
                            </label>
                            <textarea
                              value={serviceData?.description || ''}
                              onChange={(e) => handleUpdateDescription(category.id, e.target.value)}
                              placeholder="Ej: Especializado en proyectos residenciales, con certificación..."
                              rows={3}
                              maxLength={200}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {serviceData?.description?.length || 0}/200 caracteres
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{selectedServices.size}</span> servicio(s) seleccionado(s)
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-28 left-0 right-0 z-40 px-4">
        <div className="max-w-md mx-auto flex gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-2xl">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
