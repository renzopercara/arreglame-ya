"use client";

import { useMemo, useState } from "react";
import CategoryGrid from "@/components/CategoryGrid";
import SearchBar from "@/components/SearchBar";
import ServiceCard from "@/components/ServiceCard";
import useServices from "@/hooks/useServices";

const skeletons = Array.from({ length: 5 });

function ServiceSkeleton() {
  return (
    <div className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
      <div className="h-20 w-20 rounded-2xl bg-slate-200 animate-pulse" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
        <div className="flex gap-2">
          <span className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
          <span className="h-3 w-12 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { services, loading, error, refetch } = useServices();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return services.filter((svc) => {
      const matchesQuery =
        svc.title.toLowerCase().includes(query.toLowerCase()) ||
        svc.provider.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category ? svc.category === category : true;
      return matchesQuery && matchesCategory;
    });
  }, [services, query, category]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Arréglame Ya</p>
            <h1 className="text-2xl font-bold text-slate-900">Servicios cerca de ti</h1>
          </div>
          <button
            onClick={refetch}
            className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
            type="button"
          >
            Recargar
          </button>
        </div>
        <SearchBar value={query} onChange={setQuery} onFilterClick={() => setCategory(null)} />
        <CategoryGrid activeId={category} onSelect={setCategory} />
      </header>

      <section className="flex flex-col gap-3">
        {loading && skeletons.map((_, idx) => <ServiceSkeleton key={`sk-${idx}`} />)}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
            No pudimos cargar los servicios. Intenta de nuevo.
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
            No encontramos servicios para tu búsqueda.
          </div>
        )}
        {filtered.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </section>
    </div>
  );
}
