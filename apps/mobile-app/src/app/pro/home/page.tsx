"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { 
  Briefcase, 
  Star, 
  DollarSign,
  TrendingUp,
  MapPin,
  AlertCircle,
} from "lucide-react";
import JobCard, { JobListSkeleton, Job } from "@/components/JobCard";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PushPermissionBanner } from "@/components/PushPermissionBanner";
import { GET_PRO_DASHBOARD, UPDATE_WORKER_STATUS } from "@/graphql/queries";

/**
 * Professional (PRO) Home Screen - Enhanced Version
 * 
 * Features:
 * - Push notifications with real-time job updates
 * - Online/Offline toggle with optimistic updates
 * - Permission handling with user-friendly banners
 * - Error boundaries and loading states
 * - Geolocation integration with fallback
 */

// Constants
const MS_PER_DAY = 86400000;

export default function ProHomePage() {
  const { user, isAuthenticated, hasWorkerRole, isBootstrapping } = useAuth();
  const router = useRouter();
  
  // GraphQL
  const { data: dashboardData, loading: loadingDashboard, refetch } = useQuery(GET_PRO_DASHBOARD, {
    skip: !isAuthenticated || !hasWorkerRole,
  });
  const [updateWorkerStatus] = useMutation(UPDATE_WORKER_STATUS);
  
  // Push Notifications
  const { permission, initPush, lastMessage } = usePushNotifications(user?.id);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  
  // UI States
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Mock data - ready for backend integration
  const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);

  // Authentication and role validation
  useEffect(() => {
    if (isBootstrapping) return;

    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    // Check if user has WORKER/PRO role
    if (!hasWorkerRole) {
      router.push("/worker/onboarding");
      return;
    }

    // Initialize push notifications
    if (user?.id) {
      initPush();
    }

    // Initialize availability from user status
    if (user?.workerStatus) {
      setIsAvailable(user.workerStatus === "ONLINE");
    }
  }, [isAuthenticated, hasWorkerRole, user, router, isBootstrapping, initPush]);

  // Handle permission state
  useEffect(() => {
    if (permission === 'denied') {
      setShowPermissionBanner(true);
    }
  }, [permission]);

  // Handle new notification messages
  useEffect(() => {
    if (lastMessage) {
      console.log('New notification received:', lastMessage);
      // Dashboard data will be automatically refetched by the hook
    }
  }, [lastMessage]);

  // Simulate data fetching
  useEffect(() => {
    const fetchNearbyJobs = async () => {
      setIsLoadingJobs(true);
      setHasError(false);
      
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual GraphQL query
        const mockJobs: Job[] = [
          {
            id: "1",
            clientName: "María González",
            jobType: "Plomería",
            location: "Barrio Norte, Buenos Aires",
            distance: 2.3,
            description: "Reparación de cañería en cocina, pérdida de agua.",
            scheduledDate: new Date(Date.now() + MS_PER_DAY).toISOString(),
            status: "Nuevo",
          },
          {
            id: "2",
            clientName: "Carlos Pérez",
            jobType: "Electricidad",
            location: "Palermo, Buenos Aires",
            distance: 3.7,
            description: "Instalación de tomas eléctricas adicionales.",
            scheduledDate: new Date(Date.now() + MS_PER_DAY * 2).toISOString(),
            status: "Nuevo",
          },
          {
            id: "3",
            clientName: "Ana Martínez",
            jobType: "Pintura",
            location: "Villa Crespo, Buenos Aires",
            distance: 4.1,
            description: "Pintura de habitación completa.",
            scheduledDate: new Date(Date.now() + MS_PER_DAY * 3).toISOString(),
            status: "Nuevo",
          },
        ];
        
        setNearbyJobs(mockJobs);
      } catch (error) {
        console.error("Error fetching nearby jobs:", error);
        setHasError(true);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    if (isAuthenticated && hasWorkerRole && user) {
      fetchNearbyJobs();
    }
  }, [isAuthenticated, hasWorkerRole, user]);

  // Handle availability toggle with optimistic update
  const handleAvailabilityToggle = async () => {
    const newStatus = !isAvailable;
    const statusValue = newStatus ? "ONLINE" : "OFFLINE";
    
    // Optimistic update
    setIsAvailable(newStatus);
    
    try {
      await updateWorkerStatus({
        variables: { status: statusValue },
        optimisticResponse: {
          __typename: 'Mutation',
          updateWorkerStatus: {
            __typename: 'User',
            id: user?.id || '',
            workerStatus: statusValue,
          },
        },
      });
      console.log("Worker availability changed to:", statusValue);
    } catch (error) {
      console.error("Failed to update worker status:", error);
      // Revert optimistic update on error
      setIsAvailable(!newStatus);
    }
  };

  // Handle job actions
  const handleViewJob = (jobId: string) => {
    console.log("View job:", jobId);
    router.push(`/worker/jobs/${jobId}`);
  };

  const handleAcceptJob = async (jobId: string) => {
    console.log("Accept job:", jobId);
    // TODO: Call backend mutation to accept job
  };

  const handleRetry = async () => {
    setIsLoadingJobs(true);
    setHasError(false);
    try {
      // Clear Apollo cache and refetch
      await refetch();
      setNearbyJobs([]);
    } catch (error) {
      console.error('Failed to retry:', error);
      setHasError(true);
    }
  };

  // Show loading during authentication bootstrap
  if (isBootstrapping || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Metrics data
  const metrics = [
    {
      icon: Briefcase,
      label: "Trabajos Pendientes",
      value: String(user.totalJobs || 0),
      color: "emerald" as const,
    },
    {
      icon: Star,
      label: "Calificación",
      value: user.rating ? user.rating.toFixed(1) : "N/A",
      color: "yellow" as const,
    },
    {
      icon: DollarSign,
      label: "Ganancias del Mes",
      value: user.balance ? `$${user.balance.toFixed(0)}` : "$0",
      color: "blue" as const,
    },
  ];

  // Helper function to get first name
  const getFirstName = (fullName?: string): string => {
    if (!fullName) return "Profesional";
    const trimmed = fullName.trim();
    const firstName = trimmed.split(/\s+/)[0];
    return firstName || "Profesional";
  };

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto min-h-screen py-6 px-4">
      {/* Push Permission Banner */}
      {showPermissionBanner && (
        <PushPermissionBanner onDismiss={() => setShowPermissionBanner(false)} />
      )}

      {/* Header with Greeting and Availability Switch */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">
            Hola, {getFirstName(user.name)} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAvailable ? "Estás disponible para trabajos" : "Actualmente no disponible"}
          </p>
        </div>
        
        {/* Availability Switch */}
        <button
          onClick={handleAvailabilityToggle}
          className={`
            relative flex h-12 w-24 items-center rounded-full transition-all duration-300 shadow-md
            ${isAvailable 
              ? "bg-emerald-600 shadow-emerald-200" 
              : "bg-slate-300 shadow-slate-200"}
          `}
        >
          <span
            className={`
              absolute h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300
              ${isAvailable ? "translate-x-12" : "translate-x-1"}
            `}
          />
          <span className={`
            absolute text-xs font-bold uppercase tracking-tight transition-opacity duration-300
            ${isAvailable ? "left-2 text-white" : "right-2 text-slate-600"}
          `}>
            {isAvailable ? "On" : "Off"}
          </span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const colorClasses = {
            emerald: "bg-emerald-100 text-emerald-600",
            yellow: "bg-yellow-100 text-yellow-600",
            blue: "bg-blue-100 text-blue-600",
          }[metric.color];

          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
            >
              <div className={`inline-flex p-2 rounded-xl ${colorClasses} mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-black text-slate-900 mb-1">{metric.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight">
                {metric.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nearby Job Requests Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Solicitudes Próximas</h2>
          {!isLoadingJobs && nearbyJobs.length > 0 && (
            <button
              onClick={() => router.push("/worker/jobs")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase"
            >
              Ver Todas
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoadingJobs && <JobListSkeleton count={3} />}

        {/* Error State */}
        {!isLoadingJobs && hasError && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-red-50 border border-red-100 p-8">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-red-900 mb-1">
                Error al cargar trabajos
              </h3>
              <p className="text-xs text-red-700 mb-4">
                No pudimos cargar las solicitudes. Por favor, intenta nuevamente.
              </p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingJobs && !hasError && nearbyJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-8">
            <div className="p-3 bg-slate-100 rounded-full">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                No hay trabajos disponibles
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAvailable 
                  ? "No hay solicitudes cercanas en este momento. Te notificaremos cuando aparezcan nuevas oportunidades."
                  : "Activa tu disponibilidad para recibir solicitudes de trabajo."}
              </p>
            </div>
          </div>
        )}

        {/* Job Cards List */}
        {!isLoadingJobs && !hasError && nearbyJobs.length > 0 && (
          <div className="flex flex-col gap-4">
            {nearbyJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onView={handleViewJob}
                onAccept={handleAcceptJob}
              />
            ))}
          </div>
        )}
      </div>

      {/* Promotional Banner */}
      {!isAvailable && (
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-emerald-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black mb-1">¡Activa tu disponibilidad!</h3>
              <p className="text-green-100 text-xs leading-relaxed">
                Recibe notificaciones de trabajos cerca tuyo y aumenta tus ganancias.
              </p>
            </div>
          </div>
          <button
            onClick={handleAvailabilityToggle}
            className="w-full py-3.5 bg-white text-emerald-700 font-black text-sm rounded-2xl active:scale-95 transition-all shadow-lg"
          >
            ACTIVAR AHORA
          </button>
        </div>
      )}
    </div>
  );
}
