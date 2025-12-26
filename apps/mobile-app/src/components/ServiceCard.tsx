import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

export interface Service {
  id: string;
  title: string;
  provider: string;
  rating: number;
  price: string;
  category: string;
  image: string;
}

export default function ServiceCard({ service, onSelect }: { service: Service; onSelect?: (id: string) => void }) {
  const imageSrc =
    service.image?.trim() ||
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160' fill='none'><rect width='160' height='160' rx='16' fill='%23E5E7EB'/><path d='M48 104L68 84L88 104L112 80' stroke='%2399A1B3' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/><circle cx='52' cy='60' r='12' fill='%2399A1B3'/></svg>";

  return (
    <Link
      href={`/services/${service.id}`}
      onClick={() => onSelect?.(service.id)}
      className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
        <Image src={imageSrc} alt={service.title} fill className="object-cover" sizes="80px" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{service.title}</h3>
          <span className="text-sm font-semibold text-blue-600">{service.price}</span>
        </div>
        <p className="text-sm text-slate-500">{service.provider}</p>
        <div className="flex items-center gap-1 text-sm text-amber-500">
          <Star className="h-4 w-4 fill-amber-400" />
          <span className="font-semibold text-slate-700">{service.rating.toFixed(1)}</span>
          <span className="text-slate-400">• {service.category}</span>
        </div>
      </div>
    </Link>
  );
}
