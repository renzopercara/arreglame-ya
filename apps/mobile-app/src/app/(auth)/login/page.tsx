"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-blue-600">Bienvenido</p>
          <h1 className="text-2xl font-bold text-slate-900">Accede a tu cuenta</h1>
        </div>
      </header>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <form className="flex flex-col gap-4">
          <label className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 shadow-inner">
            <Mail className="h-5 w-5 text-slate-400" />
            <input
              type="email"
              placeholder="Email"
              className="w-full border-none bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 shadow-inner">
            <Lock className="h-5 w-5 text-slate-400" />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full border-none bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="mt-2 flex items-center justify-center rounded-3xl bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          >
            Iniciar sesión
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-center text-sm text-slate-600">¿No tienes cuenta?</p>
        <Link
          href="/signup"
          className="flex items-center justify-center rounded-3xl bg-slate-100 px-4 py-3 text-base font-bold text-slate-800 shadow-sm transition hover:bg-slate-200 active:scale-95"
        >
          Crear cuenta
        </Link>
        <Link
          href="/search"
          className="flex items-center justify-center rounded-3xl bg-white px-4 py-3 text-base font-semibold text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          Explorar servicios
        </Link>
      </div>
    </div>
  );
}
