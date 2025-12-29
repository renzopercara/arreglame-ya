"use client";

import { useQuery } from "@apollo/client/react";
import { ME_QUERY } from "@/graphql/queries";
import LocationSelector from "./LocationSelector";
import { Sparkles } from "lucide-react";

export default function WelcomeHeader() {
  const { data, loading } = useQuery<{
    me: {
      id: string;
      name: string;
      activeRole?: 'CLIENT' | 'PROVIDER';
    }
  }>(ME_QUERY, {
    errorPolicy: 'ignore', // No fallar si no está autenticado
  });

  const user = data?.me;
  const firstName = user?.name?.split(' ')[0] || 'Invitado';
  const isProvider = user?.activeRole === 'PROVIDER';

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-600 flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          {isProvider ? 'Panel de Servicios' : 'Descubre'}
        </p>
        {loading ? (
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg mt-1" />
        ) : (
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {user ? `Hola, ${firstName}` : 'Arreglame Ya'}
          </h1>
        )}
        {/* Location selector / status */}
        <div className="mt-3">
          <LocationSelector />
        </div>
      </div>
      
      {user && (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
            {firstName[0]?.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
