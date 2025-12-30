"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { ArrowLeft, Mail, Lock, User, UserCog, X } from "lucide-react";
import { StorageAdapter } from "@/lib/adapters/storage";
import { LOGIN_MUTATION, REGISTER_MUTATION } from "@/graphql/queries";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "register";

type FormValues = {
  name?: string;
  email: string;
  password: string;
  role: "CLIENT" | "WORKER";
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: Mode;
  onSuccess?: () => void;
}

function AuthContent({ defaultMode = "login", onClose, onSuccess }: { defaultMode?: Mode; onClose: () => void; onSuccess?: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(defaultMode);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "CLIENT",
    },
    mode: "onChange",
  });

  const role = watch("role");

  type LoginResult = { login: { accessToken: string; user: { mustAcceptTerms: boolean } } };
  type RegisterResult = { register: { accessToken: string; user: { mustAcceptTerms: boolean } } };
  const [login] = useMutation<LoginResult>(LOGIN_MUTATION);
  const [registerUser] = useMutation<RegisterResult>(REGISTER_MUTATION);

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === "login") {
        const { data } = await login({
          variables: { email: values.email, password: values.password, role: values.role },
        });
        const token = data?.login?.accessToken;
        if (token) {
          await StorageAdapter.set("auth.token", token);
          onSuccess?.();
          onClose();
        }
        return;
      }

      // Register flow
      const { data } = await registerUser({
        variables: {
          email: values.email,
          password: values.password,
          name: values.name,
          role: values.role,
          termsAccepted: true,
          termsVersion: "v1",
          termsDate: new Date().toISOString(),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "web",
        },
      });
      const token = data?.register?.accessToken;
      if (token) {
        await StorageAdapter.set("auth.token", token);
        onSuccess?.();
        onClose();
      }
    } catch (e: any) {
      // Manejo robusto de errores según el runbook de ingeniería
      if (e.networkError) {
        console.error('[Network Error] API no disponible:', {
          url: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql',
          error: e.networkError,
        });
        alert(
          '❌ Error de conexión\n\n' +
          'El servidor no está disponible. Por favor:\n' +
          '1. Verifica que el backend esté corriendo en el puerto 3001\n' +
          '2. Revisa la consola del servidor para errores\n' +
          '3. Confirma que la URL del API sea correcta\n\n' +
          `URL esperada: ${process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql'}`
        );
        return;
      }

      if (e.graphQLErrors && e.graphQLErrors.length > 0) {
        e.graphQLErrors.forEach((gqlError: any) => {
          console.error(`[GraphQL Error]: ${gqlError.message}`, gqlError);
        });
        alert(`Error: ${e.graphQLErrors[0].message || 'Error en la operación'}`);
        return;
      }

      // Error genérico
      console.error('[Auth Error]:', e);
      alert(e.message || "Error en autenticación");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">{mode === "login" ? "Bienvenido" : "Crear cuenta"}</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "login" ? "Accede a tu cuenta" : "Únete a Arréglame Ya"}
          </h1>
        </div>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition active:scale-95"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>
      </header>

      {/* Mode Switch */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition active:scale-95 ${
            mode === "login" ? "bg-blue-600 text-white" : "bg-white text-slate-700"
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          onClick={() => setMode("register")}
          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition active:scale-95 ${
            mode === "register" ? "bg-blue-600 text-white" : "bg-white text-slate-700"
          }`}
        >
          Crear Cuenta
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {mode === "register" && (
          <label className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 shadow-inner">
            <User className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Nombre completo"
              {...register("name", { required: "Tu nombre es requerido", minLength: { value: 2, message: "Nombre demasiado corto" } })}
              className="w-full border-none bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
        )}
        {errors.name && <p className="text-xs text-red-600 px-2 -mt-2">{errors.name.message}</p>}

        <label className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 shadow-inner">
          <Mail className="h-5 w-5 text-slate-400" />
          <input
            type="email"
            placeholder="Email"
            {...register("email", { required: "El email es requerido", pattern: { value: /.+@.+\..+/, message: "Email inválido" } })}
            className="w-full border-none bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
        {errors.email && <p className="text-xs text-red-600 px-2 -mt-2">{errors.email.message}</p>}

        <label className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 shadow-inner">
          <Lock className="h-5 w-5 text-slate-400" />
          <input
            type="password"
            placeholder="Contraseña"
            {...register("password", { required: "La contraseña es requerida", minLength: { value: 6, message: "Mínimo 6 caracteres" } })}
            className="w-full border-none bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
        {errors.password && <p className="text-xs text-red-600 px-2 -mt-2">{errors.password.message}</p>}

        {/* Role toggle */}
        <div className="flex items-center gap-2 rounded-2xl bg-gray-50 p-2 shadow-inner">
          <button
            type="button"
            onClick={() => setValue("role", "CLIENT")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-95 ${
              role === "CLIENT" ? "bg-green-600 text-white" : "bg-white text-slate-700"
            }`}
          >
            <User className="h-5 w-5" /> Cliente
          </button>
          <button
            type="button"
            onClick={() => setValue("role", "WORKER")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-95 ${
              role === "WORKER" ? "bg-indigo-600 text-white" : "bg-white text-slate-700"
            }`}
          >
            <UserCog className="h-5 w-5" /> Profesional
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex items-center justify-center rounded-3xl bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
        >
          {isSubmitting ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}

export default function AuthModal({ isOpen, onClose, defaultMode = "login", onSuccess }: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full pointer-events-auto max-h-[90vh] overflow-y-auto">
              <AuthContent defaultMode={defaultMode} onClose={onClose} onSuccess={onSuccess} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { AuthModal };
