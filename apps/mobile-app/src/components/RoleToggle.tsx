'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { User, Briefcase, Loader2 } from 'lucide-react';
import { SWITCH_ACTIVE_ROLE, ME_QUERY } from '@/graphql/queries';
import { toast } from 'sonner';

export default function RoleToggle() {
  const { data, loading: queryLoading } = useQuery<{
    me: {
      id: string;
      name: string;
      role: string;
      activeRole: 'CLIENT' | 'WORKER';
    };
  }>(ME_QUERY);

  const [switchRole, { loading: mutationLoading }] = useMutation<{
    switchActiveRole: {
      id: string;
      activeRole: 'CLIENT' | 'WORKER';
    };
  }>(SWITCH_ACTIVE_ROLE, {
    refetchQueries: [{ query: ME_QUERY }],
    onCompleted: (data) => {
      const newRole = data.switchActiveRole.activeRole;
      toast.success(
        `Cambiaste a modo ${newRole === 'CLIENT' ? 'Cliente' : 'Profesional'}`,
        {
          description: newRole === 'CLIENT' ? '👤 Busca y contrata servicios' : '🔧 Recibe y gestiona trabajos',
          duration: 3000,
        }
      );
    },
    onError: (error) => {
      // Error will be handled by global error link
      console.error('Error switching role:', error);
    },
  });

  const user = data?.me;
  const isClient = user?.activeRole === 'CLIENT';
  const loading = queryLoading || mutationLoading;

  if (!user) return null;

  // Si el usuario solo tiene un rol disponible, no mostrar el toggle
  const hasMultipleRoles = user.role === 'WORKER'; // Los WORKER pueden cambiar entre ambos roles
  if (!hasMultipleRoles) return null;

  const handleToggle = () => {
    if (loading) return;
    const newRole = isClient ? 'WORKER' : 'CLIENT';
    switchRole({ variables: { activeRole: newRole } });
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
      <h3 className="font-bold text-lg mb-4">Modo de Uso</h3>
      
      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1 flex items-center gap-1">
        {/* Cliente Option */}
        <button
          onClick={() => !isClient && handleToggle()}
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            isClient
              ? 'bg-white text-blue-600 shadow-md'
              : 'text-white hover:bg-white/10'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <User className="w-5 h-5" />
            <span>Cliente</span>
            {loading && isClient && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        </button>

        {/* Proveedor Option */}
        <button
          onClick={() => isClient && handleToggle()}
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            !isClient
              ? 'bg-white text-purple-600 shadow-md'
              : 'text-white hover:bg-white/10'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Briefcase className="w-5 h-5" />
            <span>Profesional</span>
            {loading && !isClient && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        </button>
      </div>

      <p className="text-sm mt-4 text-white/80">
        {isClient
          ? '🛒 Estás navegando como cliente. Busca y contrata servicios.'
          : '🔧 Estás en modo profesional. Recibe y gestiona trabajos.'}
      </p>
    </div>
  );
}
