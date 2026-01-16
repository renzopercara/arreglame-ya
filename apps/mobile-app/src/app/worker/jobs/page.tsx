"use client";

import React from "react";
import { Briefcase } from "lucide-react";

export default function WorkerJobsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto min-h-screen py-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-2xl">
          <Briefcase className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Mis Trabajos</h1>
          <p className="text-sm text-slate-500">Gestiona tus servicios</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
        <p className="text-sm text-slate-600 font-medium">
          No tienes trabajos activos en este momento.
        </p>
      </div>
    </div>
  );
}
