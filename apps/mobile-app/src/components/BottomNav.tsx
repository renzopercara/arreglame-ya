"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, ClipboardList } from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/login", label: "Acceso", icon: ClipboardList },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-screen-sm -translate-x-1/2 px-4">
      <nav className="rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <ul className="flex items-center justify-between gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/auth/login" && pathname.startsWith(item.href));

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-blue-600"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                      isActive
                        ? "border-blue-100 bg-blue-50 text-blue-600"
                        : "border-transparent bg-gray-50 text-slate-500"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
