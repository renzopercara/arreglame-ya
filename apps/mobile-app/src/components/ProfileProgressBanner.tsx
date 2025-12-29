"use client";

import usePaymentReadiness from "@/hooks/usePaymentReadiness";
import { CheckCircle2, CreditCard, Link as LinkIcon, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ProfileProgressBanner() {
  const { isLogged, role, hasPaymentMethod, isMpConnected } = usePaymentReadiness();
  const router = useRouter();

  if (!isLogged) return null;

  const isClient = role === "CLIENT";
  const isWorker = role === "WORKER";

  // Calculate progress
  const steps = [];
  if (isClient) {
    steps.push({ label: "Método de pago", done: hasPaymentMethod });
  }
  if (isWorker) {
    steps.push({ label: "Mercado Pago", done: isMpConnected });
  }

  const completedSteps = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 100;

  if (progress === 100) {
    // All set - show success banner
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4"
      >
        <CheckCircle2 className="h-6 w-6 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">¡Todo listo!</p>
          <p className="text-xs text-slate-600">Tu perfil está completo y puedes operar sin límites.</p>
        </div>
      </motion.div>
    );
  }

  // Show progress banner
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-5"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">Completa tu perfil para empezar</p>
          <p className="text-xs text-slate-600 mt-1">
            {isClient
              ? "Configura tu método de pago para contratar servicios"
              : "Vincula tu cuenta de Mercado Pago para recibir cobros"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
        />
      </div>

      {/* Steps checklist */}
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
            )}
            <span className={step.done ? "text-slate-600 line-through" : "text-slate-800 font-medium"}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Action button */}
      {isClient && !hasPaymentMethod && (
        <button
          onClick={() => router.push("/profile?setup=payments")}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition active:scale-95"
        >
          <CreditCard className="h-4 w-4" />
          Vincular método de pago
        </button>
      )}

      {isWorker && !isMpConnected && (
        <button
          onClick={() => router.push("/profile?setup=mercadopago")}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition active:scale-95"
        >
          <LinkIcon className="h-4 w-4" />
          Conectar Mercado Pago
        </button>
      )}
    </motion.div>
  );
}
