import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// --- TIPOS UNIFICADOS ---

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export type GeoPermissionStatus = 'granted' | 'denied' | 'prompt';

export interface IGeoService {
  getCurrentPosition(): Promise<GeoPosition>;
  checkPermissions(): Promise<GeoPermissionStatus>;
  requestPermissions(): Promise<boolean>;
}

// --- ADAPTER WEB (navigator.geolocation) ---

class WebGeoAdapter implements IGeoService {
  async getCurrentPosition(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('GeolocalizaciÃƒÂ³n no soportada en este navegador.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });
        },
        (err) => {
          reject(this.normalizeError(err));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  async checkPermissions(): Promise<GeoPermissionStatus> {
    if (!('permissions' in navigator)) return 'prompt'; // Fallback
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state as GeoPermissionStatus;
    } catch (e) {
      return 'prompt';
    }
  }

  async requestPermissions(): Promise<boolean> {
    // En web, el permiso se pide automÃƒÂ¡ticamente al llamar a getCurrentPosition.
    // Simulamos el request llamando y cancelando, o simplemente devolviendo true para que el flujo siga.
    try {
      await this.getCurrentPosition();
      return true;
    } catch (e) {
      return false;
    }
  }

  private normalizeError(err: GeolocationPositionError): Error {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return new Error('Permiso de ubicaciÃƒÂ³n denegado.');
      case err.POSITION_UNAVAILABLE:
        return new Error('InformaciÃƒÂ³n de ubicaciÃƒÂ³n no disponible.');
      case err.TIMEOUT:
        return new Error('Se agotÃƒÂ³ el tiempo para obtener la ubicaciÃƒÂ³n.');
      default:
        return new Error(err.message || 'Error desconocido de ubicaciÃƒÂ³n.');
    }
  }
}

// --- ADAPTER NATIVO (Capacitor) ---

class NativeGeoAdapter implements IGeoService {
  async getCurrentPosition(): Promise<GeoPosition> {
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };
    } catch (err: any) {
      throw new Error(err.message || 'Error nativo de ubicaciÃƒÂ³n');
    }
  }

  async checkPermissions(): Promise<GeoPermissionStatus> {
    const status = await Geolocation.checkPermissions();
    return status.location as GeoPermissionStatus;
  }

  async requestPermissions(): Promise<boolean> {
    const status = await Geolocation.requestPermissions();
    return status.location === 'granted';
  }
}

// --- FACTORY ---

export const GeoService: IGeoService = Capacitor.isNativePlatform()
  ? new NativeGeoAdapter()
  : new WebGeoAdapter();
