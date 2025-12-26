"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryGrid from "@/components/CategoryGrid";
import SearchBar from "@/components/SearchBar";
import ServiceCard from "@/components/ServiceCard";
import useServices from "@/hooks/useServices";

export default function SearchPage() {
  const { services, loading, error, refetch } = useServices();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const initialQuery = searchParams.get("q") || "";
    const initialCategory = searchParams.get("category");
    setQuery(initialQuery);
    setSelectedCategory(initialCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUrl = (nextQuery: string, nextCategory: string | null) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory) params.set("category", nextCategory);
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    updateUrl(value, selectedCategory);
  };

  const handleCategorySelect = (id: string | null) => {
    const next = id === selectedCategory ? null : id;
    setSelectedCategory(next);
    updateUrl(query, next);
  };

  const filtered = useMemo(() => {
    return services.filter((svc) => {
      const matchesQuery =
        svc.title.toLowerCase().includes(query.toLowerCase()) ||
        svc.provider.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = selectedCategory ? svc.category === selectedCategory : true;
      return matchesQuery && matchesCategory;
    });
  }, [services, query, selectedCategory]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Explora</p>
            <h1 className="text-2xl font-bold text-slate-900">Encuentra el especialista ideal</h1>
          </div>
          <button
            onClick={refetch}
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            type="button"
          >
            Recargar
          </button>
        </div>
        <SearchBar value={query} onChange={handleQueryChange} onFilterClick={() => handleCategorySelect(null)} />
        <CategoryGrid onSelect={handleCategorySelect} activeId={selectedCategory} />
      </header>

      <section className="flex flex-col gap-3">
        {loading && <p className="text-sm text-slate-500">Cargando servicios...</p>}
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
            Ocurrió un error al cargar los servicios. Intenta nuevamente.
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
            No encontramos resultados para tu búsqueda.
          </div>
        )}
        {filtered.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </section>
    </div>
  );
}
