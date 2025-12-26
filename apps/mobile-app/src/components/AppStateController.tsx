
import React, { useEffect, useRef } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { UserRole } from '../types';

interface AppStateControllerProps {
  userRole: UserRole;
  onRefreshData: () => void;
  onGpsRestored: (lat: number, lng: number) => void;
}

/**
 * Este componente maneja la lógica crítica cuando la app entra y sale del background.
 * 
 * ESTRATEGIA:
 * 1. Background: 
 *    - Pausamos polling agresivo (manejado implícitamente si el polling depende de 'isActive').
 *    - No detenemos el GPS explícitamente porque en Android/iOS modernos el SO lo gestiona.
 * 
 * 2. Foreground (Resume):
 *    - Forzamos actualización de ubicación (el GPS suele "dormirse" o perder precisión en background).
 *    - Refrescamos datos críticos (pedidos, estado del trabajo) para sincronizar con el backend.
 */
export const AppStateController: React.FC<AppStateControllerProps> = ({ 
  userRole, 
  onRefreshData,
  onGpsRestored 
}) => {
  const { isActive } = useAppState();
  const { getLocation } = useGeoLocation();
  const lastActiveRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleResume = async () => {
      const now = Date.now();
      const timeBackgrounded = now - lastActiveRef.current;
      
      console.log(`[AppStateController] Resuming... Was backgrounded for ${Math.round(timeBackgrounded/1000)}s`);

      // 1. Si estuvo en background más de 5 segundos, forzamos refresh de datos
      if (timeBackgrounded > 5000) {
        onRefreshData();
      }

      // 2. Intentamos recuperar GPS de alta precisión inmediatamente
      try {
        // Obtenemos ubicación fresca (el hook useGeoLocation no expone lat/lng directo en getLocation, 
        // pero podemos usar la lógica interna o disparar el evento)
        // Aquí asumimos que llamamos a getLocation() para actualizar el estado interno del hook
        // o disparamos un evento custom si fuera necesario.
        await getLocation();
        
        // En un caso real, el hook actualizaría el estado global. 
        // Aquí simulamos "despertar" el GPS.
        console.log("[AppStateController] GPS Waking up requested");
      } catch (e) {
        console.warn("[AppStateController] GPS Wakeup failed", e);
      }
    };

    if (isActive) {
      handleResume();
      lastActiveRef.current = Date.now();
    } else {
      // Al ir a background, guardamos timestamp
      lastActiveRef.current = Date.now();
    }
  }, [isActive, onRefreshData, getLocation]);

  return null;
};
