import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#16a34a", // green-600 (Color de marca)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // UX Nativa: Evita zoom accidental
};

export const metadata: Metadata = {
  title: "Arreglame Ya",
  description: "Servicios de jardinería al instante",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Arreglame Ya",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Fallback de iconos para iOS antiguos */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-slate-900 select-none`}>
        {/* select-none: Evita selección de texto (sensación app nativa) */}
        <div className="mx-auto flex min-h-screen max-w-screen-sm flex-col bg-gray-50 px-4 pb-24 pt-6">
          <main className="flex-1">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}