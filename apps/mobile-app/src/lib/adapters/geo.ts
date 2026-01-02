import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// --- TIPOS UNIFICADOS ---

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface GeoAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export type GeoPermissionStatus = 'granted' | 'denied' | 'prompt';

export interface IGeoService {
  getCurrentPosition(): Promise<GeoPosition>;
  checkPermissions(): Promise<GeoPermissionStatus>;
  requestPermissions(): Promise<boolean>;
  watchPosition(callback: (position: GeoPosition) => void, errorCallback?: (error: Error) => void): number;
  clearWatch(watchId: number): void;
  reverseGeocode(lat: number, lng: number): Promise<GeoAddress>;
}

// --- ADAPTER WEB (navigator.geolocation) ---

// Simple cache for reverse geocoding results
const geocodeCache = new Map<string, { address: GeoAddress; timestamp: number }>();
const GEOCODE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class WebGeoAdapter implements IGeoService {
  async getCurrentPosition(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocalización no soportada en este navegador.'));
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
    // En web, el permiso se pide automáticamente al llamar a getCurrentPosition.
    // Simulamos el request llamando y cancelando, o simplemente devolviendo true para que el flujo siga.
    try {
      await this.getCurrentPosition();
      return true;
    } catch (e) {
      return false;
    }
  }

  watchPosition(callback: (position: GeoPosition) => void, errorCallback?: (error: Error) => void): number {
    if (!('geolocation' in navigator)) {
      errorCallback?.(new Error('Geolocalización no soportada en este navegador.'));
      return -1;
    }

    return navigator.geolocation.watchPosition(
      (pos) => {
        callback({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        errorCallback?.(this.normalizeError(err));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  clearWatch(watchId: number): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeoAddress> {
    // Check cache first
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`; // Round to ~10m precision
    const cached = geocodeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < GEOCODE_CACHE_TTL) {
      return cached.address;
    }

    // Using Nominatim OpenStreetMap API (free, no API key required)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ArreglameYa/1.0', // Required by Nominatim
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error en la respuesta de geocodificación');
      }

      const data = await response.json();
      const address = data.address || {};

      const result: GeoAddress = {
        street: address.road || address.street,
        city: address.city || address.town || address.village,
        state: address.state,
        country: address.country,
        postalCode: address.postcode,
        formattedAddress: data.display_name,
      };

      // Cache the result
      geocodeCache.set(cacheKey, { address: result, timestamp: Date.now() });
      
      // Clean old cache entries (simple LRU)
      if (geocodeCache.size > 50) {
        const oldestKey = geocodeCache.keys().next().value;
        geocodeCache.delete(oldestKey);
      }

      return result;
    } catch (error: any) {
      console.error('[GeoService] Reverse geocoding failed:', error);
      return {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
  }

  private normalizeError(err: GeolocationPositionError): Error {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return new Error('Permiso de ubicación denegado.');
      case err.POSITION_UNAVAILABLE:
        return new Error('Información de ubicación no disponible.');
      case err.TIMEOUT:
        return new Error('Se agotó el tiempo para obtener la ubicación.');
      default:
        return new Error(err.message || 'Error desconocido de ubicación.');
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
      throw new Error(err.message || 'Error nativo de ubicación');
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

  watchPosition(callback: (position: GeoPosition) => void, errorCallback?: (error: Error) => void): number {
    // Capacitor doesn't have a direct watchPosition, but we can simulate it with setInterval
    // Using 10 seconds for better battery efficiency
    let watchId = 0;
    const intervalId = setInterval(async () => {
      try {
        const pos = await this.getCurrentPosition();
        callback(pos);
      } catch (error: any) {
        errorCallback?.(error);
      }
    }, 10000); // Update every 10 seconds for battery efficiency

    // Return a pseudo-watchId (using the interval ID)
    return intervalId as unknown as number;
  }

  clearWatch(watchId: number): void {
    clearInterval(watchId);
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeoAddress> {
    // Check cache first
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`; // Round to ~10m precision
    const cached = geocodeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < GEOCODE_CACHE_TTL) {
      return cached.address;
    }

    // Using Nominatim OpenStreetMap API (free, no API key required)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ArreglameYa/1.0', // Required by Nominatim
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error en la respuesta de geocodificación');
      }

      const data = await response.json();
      const address = data.address || {};

      const result: GeoAddress = {
        street: address.road || address.street,
        city: address.city || address.town || address.village,
        state: address.state,
        country: address.country,
        postalCode: address.postcode,
        formattedAddress: data.display_name,
      };

      // Cache the result
      geocodeCache.set(cacheKey, { address: result, timestamp: Date.now() });
      
      // Clean old cache entries (simple LRU)
      if (geocodeCache.size > 50) {
        const oldestKey = geocodeCache.keys().next().value;
        geocodeCache.delete(oldestKey);
      }

      return result;
    } catch (error: any) {
      console.error('[GeoService] Reverse geocoding failed:', error);
      return {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
  }
}

// --- FACTORY ---

export const GeoService: IGeoService = Capacitor.isNativePlatform()
  ? new NativeGeoAdapter()
  : new WebGeoAdapter();
