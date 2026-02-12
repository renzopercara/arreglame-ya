"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ThumbsUp, ThumbsDown, Home, CheckCircle, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { helpArticles, helpCategories } from "@/data/help-content";

/**
 * Help Article Content Component
 * 
 * Client component for article display with interactivity
 */
export default function HelpArticleContent({ slug }: { slug: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(null);

  // Find the article by slug
  const article = helpArticles.find((a) => a.slug === slug);
  
  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Artículo no encontrado
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            El artículo que buscas no existe o fue movido.
          </p>
          <button
            onClick={() => router.push("/help")}
            className="px-6 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors active:scale-95"
          >
            Volver al Centro de Ayuda
          </button>
        </div>
      </div>
    );
  }

  // Find category
  const category = helpCategories.find((c) => c.id === article.categoryId);

  const handleFeedback = (type: "helpful" | "not-helpful") => {
    setFeedback(type);
    // In a real app, you would send this to analytics or backend
    console.log(`Feedback for article ${article.id}:`, type);
  };

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto min-h-screen py-6 px-4">
      {/* Header with Breadcrumbs */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 flex-shrink-0 mt-1"
          aria-label="Volver"
        >
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <div className="flex-1">
          <button
            onClick={() => router.push("/help")}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 mb-1 flex items-center gap-1"
          >
            <Home className="w-3 h-3" />
            Centro de Ayuda
          </button>
          {category && (
            <p className="text-xs text-slate-400 mb-2">
              {category.name}
            </p>
          )}
          <h1 className="text-xl font-black text-slate-900 leading-tight">
            {article.title}
          </h1>
        </div>
      </div>

      {/* Article Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
      >
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-black text-slate-900 mb-4 mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-slate-900 mb-3 mt-6">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-bold text-slate-800 mb-2 mt-4">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-sm text-slate-600 leading-relaxed">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-slate-900">
                  {children}
                </strong>
              ),
              code: ({ children }) => (
                <code className="px-2 py-1 bg-slate-100 text-emerald-700 rounded text-xs font-mono">
                  {children}
                </code>
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>
      </motion.div>

      {/* Feedback Section */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
        {feedback === null ? (
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 text-center">
              ¿Te fue útil este artículo?
            </h3>
            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={() => handleFeedback("helpful")}
                className="flex-1 py-3 px-4 bg-white border-2 border-emerald-200 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ThumbsUp className="w-4 h-4" />
                Sí, me ayudó
              </motion.button>
              <motion.button
                onClick={() => handleFeedback("not-helpful")}
                className="flex-1 py-3 px-4 bg-white border-2 border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ThumbsDown className="w-4 h-4" />
                No mucho
              </motion.button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex p-3 bg-emerald-100 rounded-full mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              ¡Gracias por tu feedback!
            </h3>
            <p className="text-xs text-slate-600">
              {feedback === "helpful"
                ? "Nos alegra que este artículo te haya sido útil."
                : "Trabajaremos para mejorar este contenido. Si necesitas más ayuda, contacta a soporte."}
            </p>
          </motion.div>
        )}
      </div>

      {/* Related Articles or Back to Help Center */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push("/help")}
          className="w-full py-3.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors active:scale-95"
        >
          Volver al Centro de Ayuda
        </button>
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-4 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-5 text-white shadow-xl shadow-emerald-200">
        <h3 className="text-base font-black mb-2">¿Aún tienes dudas?</h3>
        <p className="text-green-100 text-xs mb-4 leading-relaxed">
          Para garantizar la trazabilidad técnica, los reportes deben enviarse mediante el sistema de asistencia integrado en la plataforma. No se atenderán consultas técnicas por vías externas.
        </p>
        <button
          onClick={() => router.push('/profile')}
          className="w-full py-3 bg-white text-emerald-700 font-bold text-sm rounded-xl active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Reportar Error o Solicitar Soporte
        </button>
      </div>
    </div>
  );
}
