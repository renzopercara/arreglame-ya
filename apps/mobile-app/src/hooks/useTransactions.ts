/**
 * useTransactions Hook
 * 
 * Manages user transaction history for financial profile
 * TODO: Implement GraphQL query when backend exposes transaction endpoints
 */

import { useState, useEffect, useCallback } from 'react';

export interface Transaction {
  id: string;
  date: string;
  serviceName: string;
  paymentMethod: 'CASH' | 'MERCADOPAGO' | 'DIGITAL';
  amount: number;
  commission: number;
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
}

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch user transactions
 * Currently returns empty array as backend query is not yet implemented
 * 
 * @param userId - User ID to fetch transactions for
 * @returns Transaction list with loading and error states
 */
export function useTransactions(userId?: string): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Implement GraphQL query
      // const { data } = await client.query({
      //   query: GET_USER_TRANSACTIONS,
      //   variables: { userId, limit: 50 }
      // });
      // setTransactions(data.getUserTransactions);

      // For now, return empty array (no mock data)
      setTransactions([]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}
