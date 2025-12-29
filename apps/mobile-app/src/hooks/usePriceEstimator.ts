import { useState, useEffect, useCallback, useRef } from "react";
import { gql } from "@apollo/client";
import { client } from "../../../../graphql/client";

/**
 * usePriceEstimator Hook
 * 
 * Calcula precio en tiempo real según inputs del formulario
 * Usa debounce para no saturar el servidor
 */

const ESTIMATE_PRICE_MUTATION = gql`
  mutation EstimateServicePrice($input: PriceEstimateInput!) {
    estimateServicePrice(input: $input) {
      baseTime
      totalTime
      hourlyRate
      estimatedPrice
      breakdown {
        baseCalculation
        difficultyMultiplier
        extras
      }
    }
  }
`;

export interface PriceEstimateInput {
  subcategory: string;
  metadata: Record<string, any>;
  difficultyLevel?: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  workerId?: string;
}

export interface PriceEstimate {
  baseTime: number;
  totalTime: number;
  hourlyRate: number;
  estimatedPrice: number;
  breakdown: {
    baseCalculation: string;
    difficultyMultiplier: number;
    extras: string[];
  };
}

interface UsePriceEstimatorReturn {
  estimate: PriceEstimate | null;
  loading: boolean;
  error: string | null;
  calculate: (input: PriceEstimateInput) => Promise<void>;
}

interface EstimatePriceData {
  estimateServicePrice: PriceEstimate;
}

export function usePriceEstimator(): UsePriceEstimatorReturn {
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: PriceEstimateInput) => {
    try {
      setLoading(true);
      setError(null);

      // Agregamos los tipos genéricos <Respuesta, Variables>
      const { data } = await client.mutate<EstimatePriceData, { input: PriceEstimateInput }>({
        mutation: ESTIMATE_PRICE_MUTATION,
        variables: { input },
      });

      // Ahora TypeScript sabe que data tiene estimateServicePrice
      if (data?.estimateServicePrice) {
        setEstimate(data.estimateServicePrice);
      }
    } catch (err: any) {
      console.error("Error calculating price:", err);
      setError(err.message || "Error al calcular precio");
    } finally {
      setLoading(false);
    }
  }, []);

  return { estimate, loading, error, calculate };
}

/**
 * useDebouncedPriceEstimator
 * Optimizamos usando useRef para manejar el timer sin disparar re-renders del hook
 */
export function useDebouncedPriceEstimator(
  delay = 600
): UsePriceEstimatorReturn & { debouncedCalculate: (input: PriceEstimateInput) => void } {
  const { estimate, loading, error, calculate } = usePriceEstimator();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCalculate = useCallback(
    (input: PriceEstimateInput) => {
      // Limpiamos el timer anterior si existe
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Iniciamos un nuevo timer
      timerRef.current = setTimeout(() => {
        calculate(input);
      }, delay);
    },
    [calculate, delay]
  );

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { estimate, loading, error, calculate, debouncedCalculate };
}
