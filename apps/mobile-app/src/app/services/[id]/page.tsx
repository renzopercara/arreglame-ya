// apps/mobile-app/src/app/services/[id]/page.tsx
import ServiceDetailClient from "./ServiceDetailClient";

/**
 * generateStaticParams es necesario si usas "output: export" 
 * para definir qué IDs se generarán en el build.
 */
export async function generateStaticParams() {
  return [
    { id: "service-123" },
    { id: "service-456" },
  ];
}

export default function Page({ params }: { params: { id: string } }) {
  // En Next.js 14/15, a veces params debe ser tratado como Promise 
  // pero para exportaciones estáticas simples, esto funciona:
  return <ServiceDetailClient serviceId={params.id} />;
}