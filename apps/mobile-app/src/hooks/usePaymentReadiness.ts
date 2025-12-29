"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { ME_QUERY } from "@/graphql/queries";

export interface PaymentReadiness {
  isLogged: boolean;
  role: "CLIENT" | "WORKER" | "ADMIN" | undefined;
  hasPaymentMethod: boolean; // Client side flag; real check is backend
  isMpConnected: boolean; // Worker side flag; real check is backend
}

export default function usePaymentReadiness(): PaymentReadiness {
  const { data } = useQuery<{ me?: { 
    id: string; 
    role: "CLIENT" | "WORKER" | "ADMIN";
    mercadopagoCustomerId?: string;
    mercadopagoAccessToken?: string;
  } }>(ME_QUERY, { errorPolicy: "ignore" });

  return useMemo(() => {
    const user = data?.me;
    const isLogged = !!user?.id;

    // Real checks from DB
    const hasPaymentMethod = !!user?.mercadopagoCustomerId;
    const isMpConnected = !!user?.mercadopagoAccessToken;

    return {
      isLogged,
      role: user?.role,
      hasPaymentMethod,
      isMpConnected,
    };
  }, [data]);
}
