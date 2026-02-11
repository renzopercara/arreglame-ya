import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centro de Ayuda - Arreglame Ya",
  description: "Guía completa para profesionales. Aprende a usar la plataforma, gestionar servicios, cobrar pagos y más.",
  keywords: ["ayuda", "soporte", "guía", "profesionales", "trabajadores", "servicios"],
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
