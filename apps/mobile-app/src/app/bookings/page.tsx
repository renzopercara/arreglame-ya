// apps/mobile-app/src/app/bookings/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Importamos el componente con SSR desactivado
const BookingsContent = dynamic(() => import("./BookingsContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  ),
});

export default function BookingsPage() {
  return <BookingsContent />;
}