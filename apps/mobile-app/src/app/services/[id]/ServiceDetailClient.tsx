'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useGetServiceQuery } from '@/graphql/generated';
import { CREATE_PAYMENT_PREFERENCE } from '@/graphql/queries';
import { toast } from 'sonner';
import useProtectedAction from '@/hooks/useProtectedAction';
import AuthModal from '@/components/AuthModal';
import LoadingButton from '@/components/LoadingButton';

interface ServiceDetailClientProps {
  serviceId: string;
}

export default function ServiceDetailClient({ serviceId }: ServiceDetailClientProps) {
  const { data, loading, error } = useGetServiceQuery({ variables: { id: serviceId } });
  const [createPreference, { loading: paymentLoading }] = useMutation<any>(CREATE_PAYMENT_PREFERENCE);
  
  const {
    showAuthModal,
    setShowAuthModal,
    showPaymentBanner,
    setShowPaymentBanner,
    executeProtected,
  } = useProtectedAction();

  const handleHire = async () => {
    executeProtected(
      async () => {
        const paymentPromise = async () => {
          const { data: prefData } = await createPreference({
            variables: { serviceRequestId: serviceId },
          });

          if (prefData?.createPaymentPreference?.initPoint) {
            // Redirect to Mercado Pago checkout
            window.location.href = prefData.createPaymentPreference.initPoint;
          } else {
            throw new Error('No se pudo generar el link de pago');
          }
          return prefData;
        };

        toast.promise(paymentPromise(), {
          loading: 'Asegurando tu transacción...',
          success: 'Redirigiendo a Mercado Pago...',
          error: (err) => {
            if (err.networkError) {
              return 'Error de conexión. Verifica tu internet.';
            }
            return err.message || 'Error al procesar el pago';
          },
        });
      },
      { requirePaymentMethod: true }
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen p-4 bg-gray-50">
        <header className="py-4 border-b mb-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </header>
        <main className="flex-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            {/* ID skeleton */}
            <div className="space-y-2">
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-100 rounded" />
            </div>
            {/* Status skeleton */}
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-6 w-24 bg-gray-200 rounded" />
            </div>
            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-3 w-28 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
            </div>
            {/* Grid skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">Error al cargar el servicio</p>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button onClick={() => window.history.back()} className="mt-4 rounded bg-black px-4 py-2 text-white">Volver atrás</button>
        </div>
      </div>
    );
  }

  const isAvailable = data?.getService?.status === 'CREATED';

  return (
    <>
      <div className="flex flex-col min-h-screen p-4 bg-gray-50">
        <header className="py-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800">Detalle del Servicio</h1>
        </header>
        
        <main className="flex-1 py-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">
              ID del Servicio
            </p>
            <code className="block mt-2 p-3 bg-gray-100 rounded text-blue-600 font-mono">
              {serviceId}
            </code>
            
            <div className="mt-8 grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Estado</p>
                <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-1 text-sm font-medium">{data?.getService?.status}</span>
              </div>
              {data?.getService?.description && (
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Descripción</p>
                  <p className="mt-1 text-gray-800">{data?.getService?.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Superficie</p>
                  <p className="mt-1 text-gray-800">{data?.getService?.squareMeters} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Precio</p>
                  <p className="mt-1 text-gray-800 font-bold text-lg">${data?.getService?.price?.total?.toLocaleString()} {data?.getService?.price?.currency}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Ubicación</p>
                  <p className="mt-1 text-gray-800">Lat: {data?.getService?.latitude}, Lng: {data?.getService?.longitude}</p>
                  {data?.getService?.address && <p className="mt-1 text-gray-700">{data?.getService?.address}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Cliente</p>
                  <p className="mt-1 text-gray-800">{data?.getService?.client?.name || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Imagen Antes</p>
                  {data?.getService?.gardenImageBefore && (
                    <img src={data?.getService?.gardenImageBefore} alt="Antes" className="mt-2 h-40 w-full rounded object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Imagen Después</p>
                  {data?.getService?.gardenImageAfter ? (
                    <img src={data?.getService?.gardenImageAfter} alt="Después" className="mt-2 h-40 w-full rounded object-cover" />
                  ) : (
                    <p className="mt-2 text-gray-600">Aún sin imagen</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-4 space-y-3">
          {isAvailable && (
            <LoadingButton
              onClick={handleHire}
              loading={paymentLoading}
              loadingText="Asegurando pago..."
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg"
            >
              💳 Contratar Servicio
            </LoadingButton>
          )}
          <button 
            onClick={() => window.history.back()}
            className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Volver atrás
          </button>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Retry action after login
          handleHire();
        }}
      />

      {/* Payment Setup Banner (if needed) */}
      {showPaymentBanner && (
        <div className="fixed inset-x-0 bottom-0 bg-amber-50 border-t-2 border-amber-400 p-4 shadow-lg">
          <div className="max-w-md mx-auto">
            <p className="text-amber-900 font-semibold">🔐 Configura tu método de pago</p>
            <p className="text-amber-700 text-sm mt-1">Para contratar servicios, primero debes agregar una tarjeta.</p>
            <button
              onClick={() => window.location.href = '/profile?section=payment'}
              className="mt-3 w-full py-2 px-4 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              Ir a Configuración
            </button>
          </div>
        </div>
      )}
    </>
  );
}