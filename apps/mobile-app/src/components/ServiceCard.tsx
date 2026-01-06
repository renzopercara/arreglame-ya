import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import Badge from "./Badge";

export interface Service {
  id: string;
  title: string;
  provider: string;
  rating: number;
  price: string;
  category: string;
  image: string;
}

export default function ServiceCard({
  service,
  onSelect,
}: {
  service: Service;
  onSelect?: (id: string) => void;
}) {
  const imageSrc =
    service.image?.trim() ||
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80' fill='none'><rect width='80' height='80' rx='12' fill='%23E5E7EB'/><circle cx='40' cy='32' r='10' fill='%2399A1B3'/><path d='M22 58c4-8 12-12 18-12s14 4 18 12' stroke='%2399A1B3' stroke-width='4' stroke-linecap='round'/></svg>";

  return (
    <Link
      href={`/services/${service.id}`}
      onClick={() => onSelect?.(service.id)}
      className="
        flex w-full items-center gap-3
        rounded-xl bg-white
        px-3 py-2
        shadow-sm transition
        active:scale-[0.98]
      "
    >
      {/* Icon / Image */}
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={imageSrc}
          alt={service.title}
          fill
          className="object-cover"
          sizes="44px"
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {service.title}
          </h3>
          <span className="text-sm font-bold text-blue-600">
            {service.price}
          </span>
        </div>

        <p className="truncate text-xs text-slate-500">
          {service.provider}
        </p>

        <div className="mt-1 flex items-center gap-1 text-xs">
          <Star className="h-3.5 w-3.5 fill-amber-400" />
          {service.rating.toFixed(1)}
        </div>

        {/* 👇 TAGS */}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge label={service.category} />
          <Badge label="24h" />
        </div>
      </div>
    </Link>
  );
}
