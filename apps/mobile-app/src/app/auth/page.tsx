"use client";

import React, { Suspense, useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  UserCog, 
  Loader2, 
} from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '../providers';
import LoadingButton from '@/components/LoadingButton';

/* -------------------------------------------------------------------------- */
/* AUTH PAGE COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

type Mode = "login" | "register";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const { login, register, isAuthenticated, user } = useAuth();
  
  // Estado local del formulario
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT" as "CLIENT" | "WORKER",
    termsAccepted: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use activeRole for routing since it represents the current user context
      // WORKER users have activeRole of WORKER when acting as service providers
      const targetPath = user.activeRole === 'CLIENT' 
        ? '/client/home' 
        : '/worker/dashboard';
      router.replace(targetPath);
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous error state before new attempt
    setError(null);
    setIsLoading(true);
    
    try {
      if (mode === "login") {
        // Login mutation
        await login(form.email, form.password, form.role);
        
        // On success, redirect based on role
        // WORKER users should go to /worker/dashboard (professional dashboard)
        const targetPath = form.role === 'CLIENT' ? '/client/home' : '/worker/dashboard';
        toast.success('¡Sesión iniciada correctamente!');
        router.replace(targetPath);
      } else {
        // Register mutation
        await register(form.email, form.password, form.name, form.role, form.termsAccepted);
        
        // On success, redirect based on role
        // WORKER users should go to /worker/dashboard (professional dashboard)
        const targetPath = form.role === 'CLIENT' ? '/client/home' : '/worker/dashboard';
        toast.success('¡Cuenta creada exitosamente!');
        router.replace(targetPath);
      }
    } catch (err: any) {
      // Handle Apollo/GraphQL errors
      let errorMessage = 'Ocurrió un error inesperado';
      
      // Check for GraphQL errors in the response
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        const gqlError = err.graphQLErrors[0];
        
        // Parse error.extensions.code for deterministic error handling
        const errorCode = gqlError.extensions?.code;
        
        switch (errorCode) {
          case 'CONFLICT':
            errorMessage = gqlError.message || 'Este correo electrónico ya está registrado';
            break;
          case 'UNAUTHORIZED':
            errorMessage = gqlError.message || 'Credenciales incorrectas';
            break;
          case 'BAD_REQUEST':
            errorMessage = gqlError.message || 'Datos inválidos';
            break;
          default:
            errorMessage = gqlError.message || errorMessage;
        }
      } else if (err.networkError) {
        errorMessage = 'Error de conexión. Por favor verifica tu internet.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Display error to user
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Always clear loading state, regardless of outcome
      setIsLoading(false);
    }
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
            type="button"
            onClick={() => {
              setMode("login");
              setError(null); // Clear errors when switching modes
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null); // Clear errors when switching modes
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}

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
                onClick={() => setForm({...form, role: "WORKER"})}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-tight transition-all ${
                  form.role === "WORKER" ? "bg-white text-indigo-600 shadow-sm border border-indigo-50" : "text-slate-400"
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
              loading={isLoading}
              disabled={(mode === "register" && !form.termsAccepted) || isLoading}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>}>
      <AuthContent />
    </Suspense>
  );
}