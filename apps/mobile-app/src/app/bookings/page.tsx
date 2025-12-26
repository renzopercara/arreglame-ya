"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, ReceiptText, Loader2, Info, ChevronLeft } from "lucide-react";

/**
 * Nota: Se han reemplazado 'next/image' y 'next/navigation' por elementos
 * estándar para asegurar la compatibilidad con el entorno de previsualización.
 */

interface Booking {
  id: string;
  serviceId: string;
  title: string;
  price: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "in_progress";
  ts: number;
  window: string;
  location: string;
  image?: string;
}

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  in_progress: "bg-blue-50 text-blue-700 border border-blue-100", 
  cancelled: "bg-rose-50 text-rose-700 border border-rose-100",
  completed: "bg-slate-100 text-slate-700 border border-slate-200",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=400&fit=crop";

const tabs = [
  { id: "upcoming", label: "Próximas" },
  { id: "past", label: "Historial" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function BookingSkeleton() {
  return (
    <div className="flex gap-3 rounded-3xl bg-white p-4 shadow-sm">
      <div className="h-20 w-20 rounded-2xl bg-slate-200 animate-pulse" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
        <div className="flex gap-2">
          <span className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
          <span className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<TabId>("upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Mock de datos para la previsualización
  const fetchBookings = async () => {
    setLoading(true);
    // Simulamos carga de API
    setTimeout(() => {
      const mockData: Booking[] = [
        {
          id: "1",
          serviceId: "s1",
          title: "Corte de Cabello Premium",
          price: "$2.500",
          status: "confirmed",
          ts: Date.now() + 86400000,
          window: "14:00 - 15:00",
          location: "Av. Corrientes 1234",
          image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&h=200&fit=crop"
        },
        {
          id: "2",
          serviceId: "s2",
          title: "Limpieza Facial Profunda",
          price: "$3.800",
          status: "in_progress",
          ts: Date.now() + 3600000,
          window: "10:00 - 11:30",
          location: "Calle Falsa 123",
          image: "https://images.unsplash.com/photo-1570172619664-283833c1d205?w=200&h=200&fit=crop"
        }
      ];
      setBookings(mockData);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const cancelBooking = async (id: string) => {
    setCancelingId(id);
    setTimeout(() => {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
      setToast({ type: "success", message: "Reserva cancelada correctamente" });
      setCancelingId(null);
      setTimeout(() => setToast(null), 3000);
    }, 1000);
  };

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const upcomingList = bookings.filter((b) => b.ts >= now && b.status !== "completed" && b.status !== "cancelled");
    const pastList = bookings.filter((b) => b.ts < now || b.status === "completed" || b.status === "cancelled");
    return { upcoming: upcomingList, past: pastList };
  }, [bookings]);

  const activeList = tab === "upcoming" ? upcoming : past;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 max-w-md mx-auto shadow-xl">
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <button className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-900" />
          </button>
          <div className="flex-1 px-4 text-center">
            <h1 className="text-xl font-bold text-slate-900">Mis Reservas</h1>
          </div>
          <button 
            onClick={handleRefresh}
            className={`p-2 hover:bg-slate-100 rounded-full transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <Loader2 size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl relative">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 py-2.5 text-sm font-bold transition-colors z-10 ${
                tab === t.id ? "text-blue-600" : "text-slate-500"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="tab-active"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xs"
          >
            <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-lg border ${
              toast.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
            }`}>
              <Info size={18} />
              <p className="text-xs font-bold">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Container */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <BookingSkeleton key={i} />)
        ) : activeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500">
              <Calendar size={40} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No hay reservas</h3>
              <p className="text-sm text-slate-500 px-10">Agenda un servicio para verlo aquí.</p>
            </div>
          </div>
        ) : (
          activeList.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4"
            >
              <div className="flex gap-4">
                <img 
                  src={b.image || FALLBACK_IMAGE} 
                  alt={b.title}
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-100"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{b.title}</h4>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${STATUS_STYLES[b.status]}`}>
                      {b.status === "confirmed" && "Confirmada"}
                      {b.status === "pending" && "Pendiente"}
                      {b.status === "in_progress" && "En curso"}
                      {b.status === "completed" && "Completada"}
                      {b.status === "cancelled" && "Cancelada"}
                    </span>
                  </div>
                  <p className="text-blue-600 font-black text-sm mb-2">{b.price}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <Clock size={12} className="text-blue-500" />
                      {b.window}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <MapPin size={12} className="text-blue-500" />
                      {b.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <button className="flex-1 py-2.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                  Ver detalle
                </button>
                {tab === "upcoming" && b.status !== "in_progress" && (
                  <button 
                    onClick={() => cancelBooking(b.id)}
                    disabled={cancelingId === b.id}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    {cancelingId === b.id && <Loader2 size={14} className="animate-spin" />}
                    Cancelar
                  </button>
                )}
                <button className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
                  <ReceiptText size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </main>

      {/* Tab Bar Inferior (Estilo Mobile) */}
      <nav className="bg-white border-t border-slate-100 px-8 py-4 flex justify-between items-center shrink-0">
        <NavItem active icon={<Calendar size={20} />} />
        <NavItem icon={<Clock size={20} />} />
        <NavItem icon={<MapPin size={20} />} />
        <NavItem icon={<div className="w-8 h-8 rounded-full bg-slate-200" />} />
      </nav>
    </div>
  );
}

function NavItem({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <button className={`p-2 transition-colors ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
      {icon}
    </button>
  );
}