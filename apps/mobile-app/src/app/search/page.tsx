"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CategoryGrid from "@/components/CategoryGrid";
import SearchBar from "@/components/SearchBar";
import ServiceCard from "@/components/ServiceCard";
import { ServiceGridSkeleton } from "@/components/ServiceCardSkeleton";
import EmptySearchState from "@/components/EmptySearchState";
import useServices from "@/hooks/useServices";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * Search page with URL-first state management.
 * All search parameters live in the URL as single source of truth.
 * Features: debounced search (300ms), sticky filters, skeleton screens, animations.
 */
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL params as single source of truth
  const urlQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category");
  
  // Local input state (uncontrolled for better UX)
  const [inputValue, setInputValue] = useState(urlQuery);
  
  // Debounce input value before updating URL (300ms)
  const debouncedQuery = useDebounce(inputValue, 300);
  
  // Sync URL when debounced value changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    } else {
      params.delete("q");
    }
    
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [debouncedQuery, router, searchParams]);
  
  // Initialize input from URL on mount
  useEffect(() => {
    setInputValue(urlQuery);
  }, [urlQuery]);
  
  // Fetch services based on URL params
  const { services, loading, error } = useServices({
    category: urlCategory,
    query: urlQuery,
  });

  const handleCategorySelect = (categoryId: string | null) => {
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
    router.replace("/search", { scroll: false });
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Sticky header with search and filters */}
      <header className="sticky top-0 z-10 flex flex-col gap-4 bg-slate-50/95 backdrop-blur-sm pb-4 -mx-6 px-6 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Explora</p>
            <h1 className="text-2xl font-bold text-slate-900">Encuentra el especialista ideal</h1>
          </div>
        </div>
        
        <SearchBar 
          value={inputValue} 
          onChange={setInputValue} 
          onFilterClick={handleClearFilters}
          placeholder="Buscar servicios..."
        />
        
        <CategoryGrid 
          onSelect={handleCategorySelect} 
          activeId={urlCategory} 
        />
      </header>

      {/* Results section with animations */}
      <section className="flex flex-col gap-4">
        {/* Loading skeleton */}
        {loading && <ServiceGridSkeleton count={4} />}
        
        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-50 border border-red-200 p-4 text-center"
          >
            <p className="text-sm font-semibold text-red-600">
              Ocurrió un error al cargar los servicios. Intenta nuevamente.
            </p>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !error && services.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <EmptySearchState 
              query={urlQuery}
              category={urlCategory}
              onClearFilters={handleClearFilters}
            />
          </motion.div>
        )}

        {/* Service results with stagger animation */}
        {!loading && !error && services.length > 0 && (
          <>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-600"
            >
              <strong>{services.length}</strong> servicios encontrados
            </motion.p>
            
            <AnimatePresence mode="popLayout">
              <motion.div 
                layout
                className="grid grid-cols-1 gap-4"
              >
                {services.map((service, index) => (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.05, // Stagger effect
                    }}
                  >
                    <ServiceCard service={service} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </section>
    </div>
  );
}

// Main export with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6 pb-8">
        <div className="flex flex-col gap-4">
          <div className="h-16 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-12 bg-slate-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
        <ServiceGridSkeleton count={3} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}