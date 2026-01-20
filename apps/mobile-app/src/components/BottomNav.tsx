"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, ClipboardList, Home, LayoutDashboard, MessageSquare, Search, UserIcon, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/app/providers";



interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, isBootstrapping, hasWorkerRole, switchRole } = useAuth();
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const isWorkerMode = user?.activeRole === 'PROVIDER';
  const themeColor = isWorkerMode ? 'green' : 'blue';

  // Quick role switch handler
  const handleQuickRoleSwitch = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    setIsSwitchingRole(true);
    
    try {
      if (isWorkerMode) {
        // Switch to CLIENT mode
        await switchRole('CLIENT');
        router.push('/');
      } else {
        // Switch to PROVIDER mode
        if (hasWorkerRole) {
          await switchRole('PROVIDER');
          router.push('/worker/dashboard');
        } else {
          router.push('/worker/onboarding');
        }
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const isNavItemActive = (itemHref: string, currentPath: string): boolean => {
    if (itemHref === "/") return currentPath === "/";
    return currentPath === itemHref || currentPath.startsWith(itemHref + "/");
  };

  const getNavItems = (): NavItem[] => {
    if (!isAuthenticated || !user) {
      return [
        { href: "/", label: "Inicio", icon: Home },
        { href: "/search", label: "Buscar", icon: Search },
        { href: "/profile", label: "Acceso", icon: UserIcon },
      ];
    }

    if (user.activeRole === 'PROVIDER') {
      return [
        { href: "/worker/dashboard", label: "Panel", icon: LayoutDashboard },
        { href: "/worker/jobs", label: "Trabajos", icon: Briefcase },
        { href: "/worker/chat", label: "Chat", icon: MessageSquare },
        { href: "/profile", label: "Perfil", icon: UserIcon },
      ];
    }

    return [
      { href: "/", label: "Inicio", icon: Home },
      { href: "/search", label: "Buscar", icon: Search },
      { href: "/bookings", label: "Pedidos", icon: ClipboardList },
      { href: "/profile", label: "Perfil", icon: UserIcon },
    ];
  };

  const navItems = getNavItems();

  if (isBootstrapping) {
    return (
      <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-6">
        <nav className="rounded-3xl border border-slate-200 bg-white/80 p-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between h-14 animate-pulse px-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-2xl bg-slate-100" />
              </div>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-6">
      <nav className={`
        rounded-3xl border p-2 shadow-2xl backdrop-blur-xl
        ${isWorkerMode 
          ? 'border-emerald-200/40 bg-white/80 shadow-emerald-200/50' 
          : 'border-blue-200/40 bg-white/80 shadow-blue-200/50'}
      `}>
        <ul className="flex items-center justify-around relative">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item.href, pathname);

            return (
              <li key={item.href} className="flex-1 max-w-[80px]">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1.5 py-1 transition-all duration-300 ${
                    isActive
                      ? themeColor === 'green' ? "text-emerald-600 scale-105" : "text-blue-600 scale-105"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 ${
                      isActive
                        ? themeColor === 'green' 
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                          : "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "bg-transparent text-slate-400"
                    }`}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight uppercase transition-all duration-300 ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 h-0 -translate-y-2'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Role Mode Indicator - Only shown when authenticated */}
          {isAuthenticated && user && (
            <li className="absolute -top-14 right-0">
              <button
                onClick={handleQuickRoleSwitch}
                disabled={isSwitchingRole}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-[10px] font-bold uppercase tracking-wide
                  transition-all duration-300 shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-95
                  ${isWorkerMode 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'}
                `}
              >
                <span>{isWorkerMode ? '🔧 Pro' : '👤 Cliente'}</span>
                <ArrowLeftRight size={10} />
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}