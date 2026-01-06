// apps/mobile-app/src/app/bookings/BookingsContent.tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, ReceiptText, Loader2, Info, ChevronLeft } from "lucide-react";
import useBookings, { Booking } from "@/hooks/useBookings";

// ... (Copia aquí todas las constantes como STATUS_STYLES, FALLBACK_IMAGE, etc.)
const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  in_progress: "bg-blue-50 text-blue-700 border border-blue-100", 
  cancelled: "bg-rose-50 text-rose-700 border border-rose-100",
  completed: "bg-slate-100 text-slate-700 border border-slate-200",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=400&fit=crop";

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
      </div>
    </div>
  );
}

// Cambiamos el nombre a BookingsContent
export default function BookingsContent() {
  const { bookings, loading, refetch } = useBookings();
  const [tab, setTab] = useState<TabId>("upcoming");
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => { 
    setRefreshing(true); 
    await refetch(); 
    setRefreshing(false); 
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
      {/* ... TODO EL RESTO DE TU JSX ORIGINAL ... */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-900 text-center">Mis Reservas</h1>
          {/* Tu lógica de tabs y lista aquí... */}
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {loading ? <BookingSkeleton /> : activeList.map(b => (
              <div key={b.id}>{b.title}</div> // Tu mapeo original
          ))}
      </main>
    </div>
  );
}