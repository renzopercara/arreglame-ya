"use client";

import { useEffect, useState } from "react";

/**
 * Hook para debouncing de valores.
 * Útil para evitar llamadas excesivas a la API mientras el usuario escribe.
 * 
 * @param value - El valor a debounce
 * @param delay - Delay en milisegundos (default: 300ms)
 * @returns El valor debounced
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Setear un timeout para actualizar el valor debounced
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timeout si el valor cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
