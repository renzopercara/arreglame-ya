// apps/mobile-app/src/app/offline/page.tsx
"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Sin conexión</h1>
      <p className="mt-2 text-slate-600">
        Parece que no tienes internet. Revisa tu conexión para seguir usando Arreglame Ya.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-6 rounded-xl bg-blue-600 px-6 py-2 text-white font-semibold"
      >
        Reintentar
      </button>
    </div>
  );
}