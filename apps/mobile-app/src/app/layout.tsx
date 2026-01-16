import React from "react";
import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import RoleSwitcher from "@/components/RoleSwitcher";
import { Providers } from './providers';
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-gray-50 text-slate-900 select-none font-sans antialiased overflow-x-hidden">
        <div className="mx-auto flex min-h-screen max-w-screen-sm flex-col bg-gray-50">
          <Providers>
            {/* Padding ajustado para no chocar con la BottomNav */}
            <main className="flex-1 px-4 pt-6 pb-24">
              {children}
            </main>
            <RoleSwitcher />
            <BottomNav />
          </Providers>
        </div>
      </body>
    </html>
  );
}