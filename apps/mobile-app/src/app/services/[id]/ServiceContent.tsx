'use client';
// Mueve aquí TODA la lógica que usa Apollo (useGetServiceQuery, useMutation, etc.)
import { useMutation } from '@apollo/client/react';
import { useGetServiceQuery } from '@/graphql/generated';
import { CREATE_PAYMENT_PREFERENCE } from '@/graphql/queries';
// ... (copia todos los imports necesarios)

export default function ServiceContent({ serviceId }: { serviceId: string }) {
  const { data, loading, error } = useGetServiceQuery({
    variables: { id: serviceId },
    skip: !serviceId,
  });

  // ... Copia aquí todo el renderizado de datos, handleHire, etc.
  if (loading) return <div>Cargando datos...</div>;
  if (error) return <div>Error</div>;

  return (
    <div>
      {/* Tu JSX actual con el detalle del servicio */}
      <h1>{data?.getService?.status}</h1>
    </div>
  );
}