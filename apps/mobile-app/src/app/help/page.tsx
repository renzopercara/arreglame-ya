"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowLeft,
  Rocket,
  MapPin,
  Briefcase,
  Wallet,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { helpCategories, helpArticles, helpFAQs } from "@/data/help-content";

/**
 * Help Center Home Page
 * 
 * Main help page with search, categories, FAQs, and support CTA
 */
export default function HelpCenterPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter articles based on search query
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return helpArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Icon mapping
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Rocket,
    MapPin,
    Briefcase,
    Wallet,
    ShieldCheck,
  };

  // Color mapping for categories
  const colorMap: Record<string, { bg: string; icon: string; hover: string }> = {
    emerald: {
      bg: "bg-emerald-100",
      icon: "text-emerald-600",
      hover: "hover:bg-emerald-200",
    },
    blue: {
      bg: "bg-blue-100",
      icon: "text-blue-600",
      hover: "hover:bg-blue-200",
    },
    purple: {
      bg: "bg-purple-100",
      icon: "text-purple-600",
      hover: "hover:bg-purple-200",
    },
    red: {
      bg: "bg-red-100",
      icon: "text-red-600",
      hover: "hover:bg-red-200",
    },
    amber: {
      bg: "bg-amber-100",
      icon: "text-amber-600",
      hover: "hover:bg-amber-200",
    },
  };

  const showSearchResults = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto min-h-screen py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
          aria-label="Volver"
        >
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">Centro de Ayuda</h1>
          <p className="text-sm text-slate-500">Guía para profesionales</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar artículos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {showSearchResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-2"
          >
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
              Resultados ({filteredArticles.length})
            </h2>
            
            {filteredArticles.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
                <p className="text-sm text-slate-500">
                  No se encontraron artículos para "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredArticles.map((article) => (
                  <motion.button
                    key={article.id}
                    onClick={() => router.push(`/help/${article.slug}`)}
                    className="bg-white border border-slate-100 rounded-2xl p-4 text-left hover:border-emerald-300 hover:shadow-sm transition-all active:scale-98"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-900 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Hidden during search */}
      {!showSearchResults && (
        <>
          {/* Quick Links - Top FAQs */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
              Preguntas Frecuentes
            </h2>
            <div className="flex flex-col gap-2">
              {helpFAQs.map((faq) => (
                <motion.button
                  key={faq.id}
                  onClick={() => router.push(`/help/${faq.articleSlug}`)}
                  className="bg-white border border-slate-100 rounded-2xl p-4 text-left hover:border-emerald-300 hover:shadow-sm transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      {faq.question}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Category Grid */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
              Categorías
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {helpCategories.map((category) => {
                const Icon = iconMap[category.icon];
                const colors = colorMap[category.color];

                return (
                  <motion.button
                    key={category.id}
                    onClick={() => {
                      // Navigate to first article of category
                      const firstArticle = helpArticles.find(
                        (a) => a.categoryId === category.id
                      );
                      if (firstArticle) {
                        router.push(`/help/${firstArticle.slug}`);
                      }
                    }}
                    className={`bg-white border border-slate-100 rounded-2xl p-4 text-left ${colors.hover} transition-all active:scale-95`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`inline-flex p-3 rounded-xl ${colors.bg} mb-3`}>
                      {Icon && <Icon className={`w-6 h-6 ${colors.icon}`} />}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">
                      {category.description}
                    </p>
                    <span className="text-xs font-medium text-slate-400">
                      {category.articleCount} artículo{category.articleCount !== 1 ? 's' : ''}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Support CTA */}
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-200">
            <h3 className="text-lg font-black mb-1">¿Necesitas asistencia técnica?</h3>
            <p className="text-green-100 text-xs mb-4 leading-relaxed">
              Para garantizar la trazabilidad técnica, los reportes deben enviarse mediante el sistema de asistencia integrado en la plataforma.
            </p>
            
            <button
              onClick={() => router.push('/profile')}
              className="w-full py-3 bg-white text-emerald-700 font-bold text-sm rounded-xl active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Reportar Error o Solicitar Soporte
            </button>
          </div>
        </>
      )}
    </div>
  );
}
