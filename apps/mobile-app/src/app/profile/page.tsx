import Link from "next/link";
import { ArrowLeft, Bell, Clock3, LogOut, MapPin, ShieldCheck, Star, User } from "lucide-react";
import PaymentReadinessBanner from "@/components/PaymentReadinessBanner";
import ProfileProgressBanner from "@/components/ProfileProgressBanner";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Payment readiness banner */}
      <PaymentReadinessBanner />
      
      {/* Profile progress banner */}
      <ProfileProgressBanner />
      <header className="flex items-center gap-3">
        <Link
          href="/search"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-blue-600">Perfil</p>
          <h1 className="text-2xl font-bold text-slate-900">Tu cuenta</h1>
        </div>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Usuario invitado</p>
            <p className="text-sm text-slate-500">Completa tu perfil para mejores coincidencias</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-1 rounded-xl bg-gray-50 px-3 py-2"><Star className="h-4 w-4 text-amber-500" /> 4.9</span>
          <span className="flex items-center gap-1 rounded-xl bg-gray-50 px-3 py-2"><Clock3 className="h-4 w-4 text-blue-600" /> Pedidos recientes</span>
          <span className="flex items-center gap-1 rounded-xl bg-gray-50 px-3 py-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Verificado</span>
        </div>
        <Link
          href="/login"
          className="flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Iniciar sesión
        </Link>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Bell className="h-4 w-4 text-blue-600" />
            Notificaciones
          </div>
          <span className="text-xs font-semibold text-blue-600">Activo</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin className="h-4 w-4 text-blue-600" />
            Dirección favorita
          </div>
          <span className="text-xs font-semibold text-slate-500">Agrega tu ubicación</span>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Clock3 className="h-4 w-4 text-blue-600" />
          Pedidos recientes
        </div>
        <div className="rounded-xl border border-dashed border-slate-200 bg-gray-50 p-4 text-sm text-slate-500">
          Aún no tienes pedidos. Explora categorías y agenda tu primer servicio.
        </div>
      </section>

      <button className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm hover:-translate-y-0.5 hover:shadow-md">
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </div>
  );
}
