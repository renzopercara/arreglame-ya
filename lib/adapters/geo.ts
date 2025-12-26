
// VersiÃƒÂ³n Web Simplificada para Root (Simula comportamiento nativo si es necesario)
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
          reject(new Error('Error obteniendo ubicaciÃƒÂ³n: ' + err.message));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async checkPermissions(): Promise<GeoPermissionStatus> {
    if (!('permissions' in navigator)) return 'prompt';
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state as GeoPermissionStatus;
    } catch (e) {
      return 'prompt';
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      await this.getCurrentPosition();
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const GeoService = new WebGeoAdapter();
