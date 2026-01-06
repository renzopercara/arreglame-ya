"use client";

import React, { useState } from "react";
import { Mail, Lock, User, UserCog, X, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- YA NO DEFINIMOS useAuth AQUÍ ---

const LoadingButton = ({ children, loading, className, disabled, ...props }: any) => (
  <button 
    disabled={loading || disabled} 
    className={`${className} flex items-center justify-center gap-2`} 
    {...props}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
);

function AuthContent({ defaultMode = "login", onClose, onSuccess }: any) {
  // Aquí puedes importar el useAuth real si necesitas llamar a login()
  const [mode, setMode] = useState(defaultMode);
  const [role, setRole] = useState("CLIENT");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Lógica de autenticación real aquí
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ... Resto del código del formulario igual que el tuyo ... */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {mode === "login" ? "Bienvenido" : "Crear cuenta"}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            {mode === "login" ? "Accede a tu cuenta" : "Únete a Arréglame Ya"}
          </h1>
        </div>
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100"><X /></button>
      </header>
      
      {/* (Formulario abreviado por espacio, mantener el tuyo) */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" className="w-full rounded-2xl bg-slate-50 px-4 py-3 border" required />
          <input type="password" placeholder="Password" className="w-full rounded-2xl bg-slate-50 px-4 py-3 border" required />
          <LoadingButton loading={loading} className="bg-blue-600 text-white py-4 rounded-2xl font-bold">
             {mode === "login" ? "INICIAR SESIÓN" : "CREAR CUENTA"}
          </LoadingButton>
      </form>
    </div>
  );
}

export default function AuthModal({ isOpen, onClose, defaultMode = "login", onSuccess }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[32px] shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden">
              <AuthContent defaultMode={defaultMode} onClose={onClose} onSuccess={onSuccess} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}