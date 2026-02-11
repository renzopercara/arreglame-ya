/**
 * Help Center Type Definitions
 * 
 * Type definitions for the Worker Help Center system
 */

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  isFeatured?: boolean;
  tags?: string[];
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  articleCount: number;
}

export interface HelpFAQ {
  id: string;
  question: string;
  articleSlug: string;
}
