'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Cargamos el componente de Apollo dinámicamente y SOLO en el cliente
const ServiceContent = dynamic(() => import('./ServiceContent'), { 
  ssr: false, // ESTO ES LO MÁS IMPORTANTE: evita que Apollo toque el servidor
  loading: () => <div className="p-4">Cargando aplicación...</div> 
});

export default function ServiceDetailClient({ serviceId }: { serviceId: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="p-4">Iniciando...</div>;
  }

  return <ServiceContent serviceId={serviceId} />;
}