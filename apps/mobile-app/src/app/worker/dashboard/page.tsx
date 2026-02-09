"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  LayoutDashboard, 
  Briefcase, 
  DollarSign, 
  Star,
  TrendingUp,
  Clock,
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { GET_MY_SERVICES, UPDATE_WORKER_SPECIALTY } from "@/graphql/queries";
import { toast } from "sonner";

/**
 * Worker Dashboard Page
 * 
 * Main dashboard for PROVIDER/WORKER role
 * Shows stats, pending jobs, service catalog, and quick actions
 */
export default function WorkerDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({});

  // Fetch worker services
  const { data: servicesData, loading: loadingServices, refetch: refetchServices } = useQuery(GET_MY_SERVICES, {
    skip: !isAuthenticated || (user?.role !== 'WORKER' && user?.role !== 'ADMIN'),
    fetchPolicy: 'cache-and-network',
  });

  // Update specialty status mutation
  const [updateSpecialtyStatus] = useMutation(UPDATE_WORKER_SPECIALTY, {
    onCompleted: () => {
      refetchServices();
      setOptimisticUpdates({});
    },
    onError: (error) => {
      console.error('Error updating service status:', error);
      toast.error('Error al actualizar el servicio');
      setOptimisticUpdates({});
    },
  });

  // Redirect if not authenticated or not a worker
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (user?.role !== 'WORKER' && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const stats = [
    {
      icon: Briefcase,
      label: "Trabajos",
      value: user.totalJobs || 0,
      color: "emerald",
    },
    {
      icon: Star,
      label: "Calificación",
      value: user.rating ? user.rating.toFixed(1) : "N/A",
      color: "yellow",
    },
    {
      icon: DollarSign,
      label: "Balance",
      value: user.balance ? `$${user.balance.toFixed(0)}` : "$0",
      color: "blue",
    },
    {
      icon: Clock,
      label: "Estado",
      value: user.workerStatus || "OFFLINE",
      color: "slate",
    },
  ];

  // Handle service toggle
  const handleServiceToggle = async (serviceId: string, currentStatus: boolean) => {
    // Optimistic update
    setOptimisticUpdates(prev => ({ ...prev, [serviceId]: !currentStatus }));
    
    try {
      await updateSpecialtyStatus({
        variables: {
          input: {
            id: serviceId,
            status: currentStatus ? 'PENDING' : 'ACTIVE',
          },
        },
      });
      
      toast.success(currentStatus ? 'Servicio desactivado' : 'Servicio activado');
    } catch (error) {
      // Error handling is done in onError callback
    }
  };

  const services = servicesData?.getMyServices || [];
  const hasServices = services.length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto min-h-screen py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-2xl">
          <LayoutDashboard className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Panel Profesional</h1>
          <p className="text-sm text-slate-500">Bienvenido, {user.name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            emerald: "bg-emerald-100 text-emerald-600",
            yellow: "bg-yellow-100 text-yellow-600",
            blue: "bg-blue-100 text-blue-600",
            slate: "bg-slate-100 text-slate-600",
          }[stat.color];

          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
            >
              <div className={`inline-flex p-2 rounded-xl ${colorClasses} mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* KYC Status */}
      {user.kycStatus === 'PENDING_SUBMISSION' && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-yellow-900 mb-1">
                Completa tu Verificación
              </h3>
              <p className="text-xs text-yellow-700 mb-3">
                Para recibir pagos, necesitas verificar tu identidad.
              </p>
              <button
                onClick={() => router.push('/profile')}
                className="text-xs font-bold text-yellow-600 hover:text-yellow-700 underline"
              >
                Verificar Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mi Catálogo de Servicios */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Mi Catálogo de Servicios</h2>
          <button
            onClick={() => router.push('/profile')}
            className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            title="Configurar servicios"
          >
            <Settings className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Loading State */}
        {loadingServices && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loadingServices && !hasServices && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
            <div className="p-3 bg-slate-100 rounded-full inline-flex mb-3">
              <Settings className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              No tienes servicios configurados
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Agrega los servicios que ofreces para empezar a recibir solicitudes.
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Agregar Servicios
            </button>
          </div>
        )}

        {/* Services List */}
        {!loadingServices && hasServices && (
          <div className="flex flex-col gap-2">
            {services.map((service: any) => {
              const isActive = optimisticUpdates[service.id] !== undefined 
                ? optimisticUpdates[service.id] 
                : service.isActive;

              return (
                <div
                  key={service.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <span className="text-2xl">{getIconForService(service.iconName)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">{service.name}</div>
                      <div className="text-xs text-slate-500">
                        {service.experienceYears > 0 
                          ? `${service.experienceYears} año${service.experienceYears > 1 ? 's' : ''} de experiencia`
                          : 'Sin experiencia registrada'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Toggle Button */}
                  <button
                    onClick={() => handleServiceToggle(service.id, isActive)}
                    className={`
                      relative flex h-8 w-14 items-center rounded-full transition-all duration-300
                      ${isActive 
                        ? "bg-emerald-500" 
                        : "bg-slate-300"}
                    `}
                    disabled={optimisticUpdates[service.id] !== undefined}
                  >
                    <span
                      className={`
                        absolute h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300
                        ${isActive ? "translate-x-7" : "translate-x-1"}
                      `}
                    >
                      {optimisticUpdates[service.id] !== undefined && (
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin m-1" />
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-800">Acciones Rápidas</h2>
        
        <button
          onClick={() => router.push('/worker/jobs')}
          className="w-full p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">Mis Trabajos</div>
              <div className="text-xs text-slate-400">Ver trabajos activos y completados</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/profile')}
          className="w-full p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Star className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">Mi Perfil</div>
              <div className="text-xs text-slate-400">Editar información y servicios</div>
            </div>
          </div>
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-emerald-200">
        <h3 className="text-xl font-black mb-1">¿Necesitas ayuda?</h3>
        <p className="text-green-100 text-xs mb-4 leading-relaxed">
          Consulta nuestra guía para profesionales o contacta a soporte.
        </p>
        <button 
          onClick={() => router.push('/help')}
          className="w-full py-3.5 bg-white text-emerald-700 font-black text-sm rounded-2xl active:scale-95 transition-all shadow-lg"
        >
          VER GUÍA
        </button>
      </div>
    </div>
  );
}

// Helper function to get icon emoji for service
function getIconForService(iconName: string): string {
  const iconMap: Record<string, string> = {
    'wrench': '🔧',
    'paint-roller': '🎨',
    'droplet': '💧',
    'zap': '⚡',
    'wind': '❄️',
    'hammer': '🔨',
    'scissors': '✂️',
    'default': '🛠️',
  };
  
  return iconMap[iconName] || iconMap.default;
}
