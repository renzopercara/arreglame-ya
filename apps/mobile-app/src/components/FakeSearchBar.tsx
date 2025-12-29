"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FakeSearchBar() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/search');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 w-full text-left"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
        <Search className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">¿Qué servicio necesitas?</p>
        <p className="text-xs text-slate-500">Plomería, electricidad, pintura...</p>
      </div>
    </button>
  );
}
