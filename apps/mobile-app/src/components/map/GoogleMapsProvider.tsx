import React, { ReactNode } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'DEMO_KEY';

interface Props {
  children: ReactNode;
}

export const GoogleMapsProvider: React.FC<Props> = ({ children }) => {
  return (
    <APIProvider 
        apiKey={API_KEY}
        libraries={['places', 'geometry']} // Cargamos Places y Geometry
        onLoad={() => console.log('Maps API Loaded')}
    >
      {children}
    </APIProvider>
  );
};
