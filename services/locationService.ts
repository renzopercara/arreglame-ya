import { GeoLocation } from '../types';
import { calculateDistance } from './mockBackend'; // Reusamos la fÃƒÂ³rmula de distancia

// ConfiguraciÃƒÂ³n de la zona de servicio (Ej: Buenos Aires)
const SERVICE_CENTER = { lat: -34.6037, lng: -58.3816 };
const MAX_RADIUS_METERS = 15000; // 15 km

export const getCurrentPosition = (): Promise<GeoLocation> => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('GeolocalizaciÃƒÂ³n no soportada por este navegador.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  });
};

export const searchAddress = async (query: string): Promise<GeoLocation[]> => {
    if (!query || query.length < 3) return [];

    try {
        // Usamos Nominatim de OpenStreetMap (Gratis, requiere User-Agent)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&limit=5`,
            {
                headers: {
                    'User-Agent': 'ArreglameYa-App/1.0'
                }
            }
        );

        if (!response.ok) throw new Error("Error en servicio de mapas");

        const data = await response.json() as any[];
        
        return data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.display_name
        }));

    } catch (error) {
        console.error("Geocoding error:", error);
        return [];
    }
};

export const validateServiceArea = (location: GeoLocation): { allowed: boolean; distance: number } => {
    const distance = calculateDistance(SERVICE_CENTER, location);
    return {
        allowed: distance <= MAX_RADIUS_METERS,
        distance
    };
};