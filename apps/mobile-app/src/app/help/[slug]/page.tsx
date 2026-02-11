import React from "react";
import { Metadata } from "next";
import { helpArticles } from "@/data/help-content";
import HelpArticleContent from "./HelpArticleContent";

/**
 * Help Article Detail Page
 * 
 * Dynamic page for displaying individual help articles with SEO metadata
 */

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = helpArticles.find((a) => a.slug === params.slug);

  if (!article) {
    return {
      title: "Artículo no encontrado - Arreglame Ya",
      description: "El artículo que buscas no existe o fue movido.",
    };
  }

  return {
    title: `${article.title} - Centro de Ayuda`,
    description: article.excerpt,
    keywords: [article.title, "ayuda", "soporte", "guía"],
  };
}

export default function HelpArticlePage({ params }: { params: { slug: string } }) {
  return <HelpArticleContent slug={params.slug} />;
}
