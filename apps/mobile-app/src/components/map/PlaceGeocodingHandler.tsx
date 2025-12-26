import { GeoLocation } from '@/types';
import React, { useEffect } from 'react';

interface PlaceGeocodingHandlerProps {
  placeId: string | null;
  onLocationResolved: (loc: GeoLocation) => void;
}

export const PlaceGeocodingHandler: React.FC<PlaceGeocodingHandlerProps> = ({ 
  placeId, 
  onLocationResolved 
}) => {
  useEffect(() => {
    if (!placeId || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ placeId }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        onLocationResolved({
          lat: loc.lat(),
          lng: loc.lng()
        });
      } else {
        console.error('Geocode was not successful for the following reason: ' + status);
      }
    });
  }, [placeId, onLocationResolved]);

  return null;
};