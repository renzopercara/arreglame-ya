
import { useState, useCallback, useEffect } from 'react';
import { GeoService, GeoPosition } from '../lib/adapters/geo';

interface UseGeoLocationResult {
  position: GeoPosition | null;
  loading: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  getLocation: () => Promise<void>;
}

export const useGeoLocation = (autoFetch = false): UseGeoLocationResult => {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  // Verificar permisos al montar
  useEffect(() => {
    GeoService.checkPermissions().then(setPermission);
  }, []);

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Verificar/Pedir permisos
      const currentPerm = await GeoService.checkPermissions();
      
      if (currentPerm === 'denied') {
        throw new Error('Permiso de ubicaciÃƒÂ³n denegado. Habilitalo en configuraciÃƒÂ³n.');
      }

      if (currentPerm === 'prompt') {
        const granted = await GeoService.requestPermissions();
        if (!granted) throw new Error('Permiso denegado por el usuario.');
        setPermission('granted');
      }

      // 2. Obtener posiciÃƒÂ³n
      const pos = await GeoService.getCurrentPosition();
      setPosition(pos);
      setPermission('granted');
      
    } catch (err: any) {
      console.error('[useGeoLocation]', err);
      setError(err.message || 'No pudimos obtener tu ubicaciÃƒÂ³n');
      if (err.message.includes('denegado')) setPermission('denied');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch opcional
  useEffect(() => {
    if (autoFetch) {
      getLocation();
    }
  }, [autoFetch, getLocation]);

  return { position, loading, error, permission, getLocation };
};
