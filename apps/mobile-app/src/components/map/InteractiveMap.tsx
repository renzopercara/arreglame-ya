import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

/**
 * Tipado local para la ubicación
 */
interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface InteractiveMapProps {
  initialCenter: GeoLocation;
  onCenterChange?: (center: GeoLocation) => void;
  markers?: Array<{id: string, lat: number, lng: number, title?: string, icon?: string}>;
  showUserLocation?: boolean;
}

/**
 * Implementación robusta del Mapa sin dependencias externas de vis.gl
 * para garantizar compatibilidad en el entorno de previsualización.
 */
export const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  initialCenter, 
  onCenterChange, 
  markers = [],
  showUserLocation 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simulación de carga de Google Maps en el entorno de previsualización
  useEffect(() => {
    // Si ya existe el objeto google o estamos en un entorno donde se inyecta
    const initMap = () => {
      if (!mapRef.current) return;
      
      // En un entorno real aquí se usaría new google.maps.Map
      // Para la previsualización, creamos una representación visual interactiva
      setIsLoaded(true);
    };

    const timer = setTimeout(initMap, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Manejo del movimiento del mapa (simulado para la UI)
  const handleMapMove = () => {
    if (onCenterChange) {
      // Simulamos un pequeño cambio para demostrar interactividad
      onCenterChange({
        lat: initialCenter.lat + (Math.random() - 0.5) * 0.001,
        lng: initialCenter.lng + (Math.random() - 0.5) * 0.001,
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[32px] bg-slate-200 border border-slate-200 shadow-inner group">
      {!isLoaded ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-50">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Mapa...</p>
        </div>
      ) : (
        <div 
          className="w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-500"
          onMouseUp={handleMapMove}
        >
          {/* Fondo de mapa simulado con estilo minimalista */}
          <div className="absolute inset-0 bg-[#f8f9fa]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e9ecef" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Representación de calles principales */}
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#dee2e6" strokeWidth="20" />
              <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#dee2e6" strokeWidth="20" />
            </svg>
          </div>

          {/* Marcadores de Trabajadores (Simulados) */}
          {markers.map((m) => (
            <div 
              key={m.id}
              className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
              style={{ 
                left: `${50 + (m.lng - initialCenter.lng) * 10000}%`, 
                top: `${50 - (m.lat - initialCenter.lat) * 10000}%` 
              }}
            >
              <div className="bg-white p-1 rounded-full shadow-lg border border-slate-100 animate-bounce">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin size={16} className="text-blue-600 fill-blue-600" />
                </div>
              </div>
            </div>
          ))}

          {/* Ubicación del Usuario (Punto azul) */}
          {showUserLocation && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-50" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* PIN FIJO CENTRAL (ESTILO UBER) */}
      {onCenterChange && isLoaded && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-30 pointer-events-none mb-2">
          <div className="flex flex-col items-center group-active:-translate-y-2 transition-transform duration-200">
            <div className="bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl mb-2 whitespace-nowrap uppercase tracking-tighter ring-4 ring-black/5">
              Confirmar punto de encuentro
            </div>
            <div className="relative">
              <MapPin size={48} className="text-blue-600 fill-blue-600 drop-shadow-2xl" />
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-600 shadow-inner"></div>
            </div>
            <div className="w-2.5 h-1 bg-black/30 rounded-full blur-[2px] mt-1 scale-x-150" />
          </div>
        </div>
      )}

      {/* Footer del Mapa */}
      <div className="absolute bottom-6 left-6 right-6 z-40 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-[24px] shadow-2xl border border-white pointer-events-auto flex items-center gap-4 transition-all hover:scale-[1.02]">
          <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
            <MapPin size={24} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ubicación Actual</p>
            <p className="text-sm font-bold text-slate-900 truncate tracking-tight">
              {initialCenter.lat.toFixed(6)}, {initialCenter.lng.toFixed(6)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;