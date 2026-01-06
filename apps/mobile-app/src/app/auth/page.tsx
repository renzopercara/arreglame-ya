"use client";

import React, { Suspense, useEffect, useState, createContext, useContext, useCallback, useMemo } from "react";
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  UserCog, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  LogOut
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* MOCKS & SIMULATED DEPENDENCIES                                             */
/* -------------------------------------------------------------------------- */

// Mock de Next Navigation
const useRouter = () => ({
  push: (path: string) => console.log(`Navigating to ${path}`),
  replace: (path: string) => console.log(`Replacing with ${path}`),
});

const useSearchParams = () => ({
  get: (key: string) => null,
  toString: () => "",
});

// Mock de Sonner Toast
const toast = {
  promise: (promise: Promise<any>, { loading, success, error }: any) => {
    console.log(loading);
    promise.then(() => console.log(success)).catch((err) => console.log(error(err)));
  }
};

// Mock de LoadingButton
const LoadingButton = ({ children, loading, className, disabled, ...props }: any) => (
  <button 
    disabled={disabled || loading} 
    className={`${className} flex items-center justify-center gap-2`} 
    {...props}
  >
    {loading && <Loader2 className="animate-spin" size={18} />}
    {children}
  </button>
);

/* -------------------------------------------------------------------------- */
/* AUTH CONTEXT (Consolidated for Preview)                                    */
/* -------------------------------------------------------------------------- */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  activeRole: 'CLIENT' | 'PROVIDER';
  mustAcceptTerms?: boolean;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const login = async (t: string, u: AuthUser) => { setUser(u); };
  const logout = async () => { setUser(null); };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within Provider");
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* AUTH PAGE COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

type Mode = "login" | "register";

function AuthContent() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const { login } = useAuth();
  
  // Estado local del formulario (Simplificado para evitar react-hook-form externo)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT" as "CLIENT" | "PROVIDER",
    termsAccepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const mutationPromise = new Promise((resolve) => {
      setTimeout(() => {
        const userData: AuthUser = {
          id: "u-123",
          name: form.name || "Usuario Demo",
          email: form.email,
          roles: [form.role],
          activeRole: form.role,
          mustAcceptTerms: false
        };
        login("fake-token", userData);
        resolve(userData);
      }, 1500);
    });

    toast.promise(mutationPromise, {
      loading: mode === "login" ? "Iniciando sesión..." : "Creando tu cuenta...",
      success: "¡Operación exitosa!",
      error: () => "Ocurrió un error."
    });

    await mutationPromise;
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        <header className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 transition active:scale-90"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              {mode === "login" ? "Acceso Directo" : "Nueva Cuenta"}
            </p>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              {mode === "login" ? "Hola de nuevo" : "Únete a la red"}
            </h1>
          </div>
        </header>

        {/* Selector de Modo */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] border border-slate-200">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Registrarse
          </button>
        </div>

        <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            {mode === "register" && (
              <div className="space-y-1">
                <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all">
                  <User className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>
            )}

            <div className="space-y-1">
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            {/* Selector de Rol */}
            <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
              <button
                type="button"
                onClick={() => setForm({...form, role: "CLIENT"})}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-tight transition-all ${
                  form.role === "CLIENT" ? "bg-white text-indigo-600 shadow-sm border border-indigo-50" : "text-slate-400"
                }`}
              >
                <User size={14} /> Cliente
              </button>
              <button
                type="button"
                onClick={() => setForm({...form, role: "PROVIDER"})}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-tight transition-all ${
                  form.role === "PROVIDER" ? "bg-white text-indigo-600 shadow-sm border border-indigo-50" : "text-slate-400"
                }`}
              >
                <UserCog size={14} /> Profesional
              </button>
            </div>

            {mode === "register" && (
              <label className="flex items-start gap-3 cursor-pointer group px-1">
                <input
                  type="checkbox"
                  required
                  checked={form.termsAccepted}
                  onChange={e => setForm({...form, termsAccepted: e.target.checked})}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Acepto los <span className="text-indigo-600 font-bold underline">Términos</span> y la <span className="text-indigo-600 font-bold underline">Privacidad</span> de Arréglame Ya.
                </span>
              </label>
            )}

            <LoadingButton
              type="submit"
              loading={isSubmitting}
              disabled={mode === "register" && !form.termsAccepted}
              className="mt-2 w-full py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {mode === "login" ? "Entrar al Sistema" : "Finalizar Registro"}
            </LoadingButton>
          </form>
        </div>

        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 leading-relaxed">
          Arréglame Ya utiliza cifrado de extremo a extremo para proteger tu identidad.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="p-8 text-center font-bold">Cargando...</div>}>
        <AuthContent />
      </Suspense>
    </AuthProvider>
  );
}