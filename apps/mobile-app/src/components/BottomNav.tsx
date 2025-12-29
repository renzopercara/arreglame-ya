"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { Home, Search, User, ClipboardList, Briefcase, MessageSquare, LayoutDashboard } from "lucide-react";
import { ME_QUERY } from "@/graphql/queries";

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { data, loading } = useQuery<{
    me: {
      id: string;
      email: string;
      role: string;
      activeRole?: 'CLIENT' | 'PROVIDER';
    }
  }>(ME_QUERY, {
    errorPolicy: 'ignore', // Ignore errors if not authenticated
  });

  const user = data?.me;

  // Define navigation items based on auth state and activeRole
  const getNavItems = (): NavItem[] => {
    if (!user) {
      // Not logged in
      return [
        { href: "/", label: "Inicio", icon: Home },
        { href: "/search", label: "Buscar", icon: Search },
        { href: "/login", label: "Acceso", icon: User },
      ];
    }

    if (user.activeRole === 'PROVIDER' || user.role === 'WORKER') {
      // Provider/Worker mode
      return [
        { href: "/worker/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/worker/jobs", label: "Trabajos", icon: Briefcase },
        { href: "/worker/chat", label: "Chat", icon: MessageSquare },
        { href: "/profile", label: "Perfil", icon: User },
      ];
    }

    // Client mode (default)
    return [
      { href: "/", label: "Inicio", icon: Home },
      { href: "/search", label: "Buscar", icon: Search },
      { href: "/bookings", label: "Pedidos", icon: ClipboardList },
      { href: "/profile", label: "Perfil", icon: User },
    ];
  };

  const navItems = getNavItems();

  if (loading) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-screen-sm -translate-x-1/2 px-4">
        <nav className="rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-1 h-16 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-xl bg-gray-200" />
                <div className="h-3 w-12 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-screen-sm -translate-x-1/2 px-4">
      <nav className="rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <ul className="flex items-center justify-between gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Fix: Exact match for "/" to prevent it from always being active
            // For other routes, check if pathname starts with the href
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

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
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
