"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
// Importación correcta para Apollo en Next.js
import { ApolloProvider } from "@apollo/client/react"; 

import { LocationProvider } from "@/contexts/LocationContext";
import { Toaster } from "sonner";
import { client } from "../../../../graphql/client";

/* -------------------------------------------------------------------------- */
/* AUTH CONTEXT                                                               */
/* -------------------------------------------------------------------------- */

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  isBootstrapping: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user] = useState(null);
  const [loading] = useState(false);
  const [isBootstrapping] = useState(false);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    isBootstrapping
  }), [user, loading, isBootstrapping]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* -------------------------------------------------------------------------- */
/* MAIN PROVIDERS COMPONENT                                                   */
/* -------------------------------------------------------------------------- */

export function Providers({ children }: { children: React.ReactNode }) {
  // Verificación crucial para evitar el error "got: undefined"
  if (!client) {
    return <div className="p-4 text-red-500">Error: Apollo Client no inicializado</div>;
  }

  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <LocationProvider>
          <Toaster position="top-center" richColors duration={4000} />
          
          <style dangerouslySetInnerHTML={{ __html: `
            .sonner-toast {
              border-radius: 1.5rem !important;
              font-family: ui-sans-serif, system-ui, sans-serif !important;
              padding: 1rem 1.5rem !important;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
            }
          `}} />

          {children}
        </LocationProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}