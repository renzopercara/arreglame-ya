"use client";

import { useRouter } from "next/navigation";
import CategoryGrid from "@/components/CategoryGrid";
import WelcomeHeader from "@/components/WelcomeHeader";
import FakeSearchBar from "@/components/FakeSearchBar";
import FeaturedServices from "@/components/FeaturedServices";
import NearYou from "@/components/NearYou";
import useServices from "@/hooks/useServices";
import useLocation from "@/hooks/useLocation";

export default function HomePage() {
  const router = useRouter();
  const { status: locStatus, city } = useLocation();
  const { services, loading } = useServices({ location: city });

  const handleCategoryClick = (categoryId: string | null) => {
    if (categoryId === null) {
      router.push("/search");
    } else {
      router.push(`/search?category=${categoryId}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header con saludo personalizado */}
      <WelcomeHeader />

      {/* Fake search bar que redirige a /search */}
      <FakeSearchBar />

      {/* Categorías con navegación a /search */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-800">¿Qué necesitas?</h2>
        <CategoryGrid onSelect={handleCategoryClick} />
      </section>

      {/* Servicios destacados (horizontal scroll) */}
      {locStatus === "pending" ? (
        <section className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Buscando servicios cerca de ti...</p>
        </section>
      ) : (
        <FeaturedServices services={services} loading={loading} />
      )}

      {/* Sección "Cerca de ti" (placeholder) */}
      <NearYou />

      {/* CTA adicional */}
      <section className="flex flex-col gap-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
        <h3 className="text-lg font-bold text-slate-800">¿Eres profesional?</h3>
        <p className="text-sm text-slate-600">
          Únete a nuestra red de trabajadores verificados y empieza a recibir solicitudes de clientes en tu área.
        </p>
        <button
          onClick={() => router.push("/auth?mode=register")}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          Registrarme como profesional
        </button>
      </section>
    </div>
  );
}