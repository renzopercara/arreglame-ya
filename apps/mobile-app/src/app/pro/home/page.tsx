"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect page for legacy /pro/home route
 * Automatically redirects to /worker/dashboard
 */
export default function ProHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/worker/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );
}
