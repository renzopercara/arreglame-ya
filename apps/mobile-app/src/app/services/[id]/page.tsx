import ServiceDetailClient from "./ServiceDetailClient";

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  // Cambiamos 'id' por algo neutro
  return [{ id: 'dynamic' }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ServiceDetailClient serviceId={params.id} />;
}