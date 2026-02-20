"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryGrid from "@/components/CategoryGrid";
import SearchBar from "@/components/SearchBar";
import ServiceCard from "@/components/ServiceCard";
import { ServiceGridSkeleton } from "@/components/ServiceCardSkeleton";
import EmptySearchState from "@/components/EmptySearchState";
import LocationSelector from "@/components/LocationSelector";
import useServices from "@/hooks/useServices";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocationContext, LocationProvider } from "@/contexts/LocationContext";
import { ApolloProvider } from "@apollo/client/react";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { latitude, longitude, cityName } = useLocationContext();
  
  const urlQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category");
  
  const [inputValue, setInputValue] = useState(urlQuery);
  // selectedCategory drives the GraphQL query directly (state-first, not URL-first)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const debouncedQuery = useDebounce(inputValue, 300);
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    } else {
      params.delete("q");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [debouncedQuery, router, searchParams]);
  
  useEffect(() => {
    setInputValue(urlQuery);
  }, [urlQuery]);
  
  // GraphQL query is driven by React state (selectedCategory), not URL params
  const { services, loading, error, refetch } = useServices({
    category: selectedCategory,
    query: urlQuery,
    location: cityName,
    latitude,
    longitude,
    radiusKm: 50,
  });

  const handleCategorySelect = (categoryId: string | null) => {
    // Update React state first – triggers GraphQL refetch without RSC navigation
    setSelectedCategory(categoryId);
    // Sync URL for bookmarking/SEO without causing an RSC re-render chain
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    setInputValue("");
    setSelectedCategory(null);
    router.replace("/search", { scroll: false });
  };

  const handleCityChange = () => {
    refetch();
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="sticky top-0 z-50 flex flex-col gap-4 bg-slate-50 backdrop-blur-md pb-4 -mx-4 px-4 pt-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Explora</p>
            <h1 className="text-2xl font-bold text-slate-900">Encuentra el especialista ideal</h1>
          </div>
        </div>
        
        <LocationSelector onCityChange={handleCityChange} />
        
        <SearchBar 
          value={inputValue} 
          onChange={setInputValue} 
          onFilterClick={handleClearFilters}
          placeholder="Buscar servicios..."
        />
        
        <CategoryGrid 
          onSelect={handleCategorySelect} 
          activeId={selectedCategory} 
        />
      </header>

      <section className="flex flex-col gap-4">
        {loading && <ServiceGridSkeleton count={4} />}
        
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <EmptySearchState 
            query={urlQuery}
            category={urlCategory}
            onClearFilters={handleClearFilters}
          />
        )}

        {!loading && !error && services.length > 0 && (
          <>
            <p className="text-sm text-slate-600">
              <strong>{services.length}</strong> servicios encontrados {cityName && `en ${cityName}`}
            </p>
            <div className="grid grid-cols-1 gap-4">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    // <ApolloProvider client={client}>
      <LocationProvider>
        <Suspense fallback={<div className="p-10 text-center">Cargando búsqueda...</div>}>
          <SearchContent />
        </Suspense>
      </LocationProvider>
    // </ApolloProvider>
  );
}