"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { ArrowLeft, Mail, Lock, User, UserCog } from "lucide-react";
import { StorageAdapter } from "@/lib/adapters/storage";
import { LOGIN_MUTATION, REGISTER_MUTATION } from "@/graphql/queries";

type Mode = "login" | "register";

type FormValues = {
  name?: string;
  email: string;
  password: string;
  role: "CLIENT" | "WORKER";
};

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");

  useEffect(() => {
    const m = (params.get("mode") as Mode) || "login";
    setMode(m === "register" ? "register" : "login");
  }, [params]);

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
    if (mode === "login") {
      const { data } = await login({
        variables: { email: values.email, password: values.password, role: values.role },
      });
      const token = data?.login?.accessToken;
      if (token) {
        await StorageAdapter.set("auth.token", token);
        const mustComplete = data?.login?.user?.mustAcceptTerms;
        router.replace(mustComplete ? "/profile" : "/");
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
      const mustComplete = data?.register?.user?.mustAcceptTerms;
      router.replace(mustComplete ? "/profile" : "/");
    }
  };

  const toggleMode = (next: Mode) => {
    setMode(next);
    const search = new URLSearchParams(params.toString());
    search.set("mode", next);
    router.replace(`/auth?${search.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <p className="text-sm font-semibold text-blue-600">{mode === "login" ? "Bienvenido" : "Crear cuenta"}</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "login" ? "Accede a tu cuenta" : "Únete a Arréglame Ya"}
          </h1>
        </div>
      </header>

      {/* Mode Switch */}
      <div className="flex gap-2">
        <button
          onClick={() => toggleMode("login")}
          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition active:scale-95 ${
            mode === "login" ? "bg-blue-600 text-white" : "bg-white text-slate-700"
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          onClick={() => toggleMode("register")}
          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition active:scale-95 ${
            mode === "register" ? "bg-blue-600 text-white" : "bg-white text-slate-700"
          }`}
        >
          Crear Cuenta
        </button>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
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

          <label className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 shadow-inner">
            <Mail className="h-5 w-5 text-slate-400" />
            <input
              type="email"
              placeholder="Email"
              {...register("email", { required: "El email es requerido", pattern: { value: /.+@.+\..+/, message: "Email inválido" } })}
              className="w-full border-none bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
          {errors.email && <p className="text-xs text-red-600 px-2">{errors.email.message}</p>}

          <label className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 shadow-inner">
            <Lock className="h-5 w-5 text-slate-400" />
            <input
              type="password"
              placeholder="Contraseña"
              {...register("password", { required: "La contraseña es requerida", minLength: { value: 6, message: "Mínimo 6 caracteres" } })}
              className="w-full border-none bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
          {errors.password && <p className="text-xs text-red-600 px-2">{errors.password.message}</p>}

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
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>
      </div>

      {/* Links */}
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm">
        {mode === "login" ? (
          <>
            <p className="text-center text-sm text-slate-600">¿No tienes cuenta?</p>
            <button
              onClick={() => toggleMode("register")}
              className="flex items-center justify-center rounded-3xl bg-slate-100 px-4 py-3 text-base font-bold text-slate-800 shadow-sm transition hover:bg-slate-200 active:scale-95"
            >
              Crear cuenta
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-slate-600">¿Ya tienes cuenta?</p>
            <button
              onClick={() => toggleMode("login")}
              className="flex items-center justify-center rounded-3xl bg-slate-100 px-4 py-3 text-base font-bold text-slate-800 shadow-sm transition hover:bg-slate-200 active:scale-95"
            >
              Iniciar sesión
            </button>
          </>
        )}
        <button
          onClick={() => router.push("/search")}
          className="flex items-center justify-center rounded-3xl bg-white px-4 py-3 text-base font-semibold text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          Explorar servicios
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
