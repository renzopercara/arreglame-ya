"use client";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ServiceMapMarker } from "./ServiceMap";

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icon for service markers
const serviceIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle map center changes with animation
function MapController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 13, {
      duration: 1.5,
    });
  }, [center.lat, center.lng, map]);
  
  return null;
}

interface MapContentProps {
  center: { lat: number; lng: number };
  markers: ServiceMapMarker[];
  userLocation?: { lat: number; lng: number };
  showAccuracyCircle?: boolean;
  onMarkerClick?: (markerId: string) => void;
}

export default function MapContent({
  center,
  markers,
  userLocation,
  showAccuracyCircle = false,
  onMarkerClick,
}: MapContentProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="w-full h-full rounded-xl"
      style={{ minHeight: "400px" }}
    >
      {/* OpenStreetMap TileLayer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Map controller for animated center changes */}
      <MapController center={center} />

      {/* User location marker with accuracy circle */}
      {userLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-sm">Tu ubicación</p>
                <p className="text-xs text-slate-600">GPS activo</p>
              </div>
            </Popup>
          </Marker>
          {showAccuracyCircle && (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={100}
              pathOptions={{
                fillColor: "blue",
                fillOpacity: 0.1,
                color: "blue",
                weight: 1,
              }}
            />
          )}
        </>
      )}

      {/* Service markers */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={serviceIcon}
          eventHandlers={{
            click: () => {
              onMarkerClick?.(marker.id);
            },
          }}
        >
          <Popup>
            <div className="flex flex-col gap-2 min-w-[200px]">
              {marker.imageUrl && (
                <img
                  src={marker.imageUrl}
                  alt={marker.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              <h3 className="font-semibold text-sm">{marker.title}</h3>
              <p className="text-xs text-slate-600">Proveedor: {marker.provider}</p>
              <p className="text-lg font-bold text-blue-600">${marker.price.toFixed(2)}</p>
              <button
                onClick={() => onMarkerClick?.(marker.id)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver detalle
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
