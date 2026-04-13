"use client";

/**
 * Portfolio Custom Hooks
 * Data fetching and state management for portfolio module
 * Uses SWR for caching and revalidation
 */

import useSWR from "swr";
import { useCallback, useState } from "react";
import {
  getPortfolios,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addTransaction,
  getPortfolioTransactions,
  type Portfolio,
  type PortfolioAsset,
  type PortfolioTransaction,
} from "./actions";

// SWR fetcher wrapper
const fetcher = <T>(fn: () => Promise<T>) => fn();

/**
 * Hook for fetching all portfolios
 * @returns SWR response with portfolios data
 */
export function usePortfolios() {
  const { data, error, isLoading, mutate } = useSWR<Portfolio[]>(
    "portfolios",
    () => fetcher(getPortfolios),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    portfolios: data ?? [],
    isLoading,
    error,
    refresh,
    mutate,
  };
}

/**
 * Hook for fetching a single portfolio
 * @param id - Portfolio ID
 * @returns SWR response with portfolio detail data
 */
export function usePortfolio(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `portfolio-${id}` : null,
    () => (id ? fetcher(() => getPortfolioById(id)) : null),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    portfolio: data?.portfolio ?? null,
    assets: data?.assets ?? [],
    transactions: data?.transactions ?? [],
    isLoading,
    error,
    refresh,
    mutate,
  };
}

/**
 * Hook for portfolio transactions
 * @param portfolioId - Portfolio ID
 * @returns SWR response with transactions data
 */
export function usePortfolioTransactions(portfolioId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<PortfolioTransaction[]>(
    portfolioId ? `transactions-${portfolioId}` : null,
    () => (portfolioId ? fetcher(() => getPortfolioTransactions(portfolioId)) : []),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    transactions: data ?? [],
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

/**
 * Hook for portfolio mutations (create, update, delete)
 * @returns Mutation functions with loading states
 */
export function usePortfolioMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const create = useCallback(async (data: {
    name: string;
    is_default?: boolean;
  }): Promise<Portfolio | null> => {
    setIsCreating(true);
    try {
      const result = await createPortfolio(data);
      return result as unknown as Portfolio;
    } catch (error) {
      console.error("Failed to create portfolio:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const update = useCallback(async (
    id: string,
    data: { name?: string; is_default?: boolean }
  ): Promise<void> => {
    setIsUpdating(true);
    try {
      await updatePortfolio(id, data);
    } catch (error) {
      console.error("Failed to update portfolio:", error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    try {
      await deletePortfolio(id);
    } catch (error) {
      console.error("Failed to delete portfolio:", error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const addTx = useCallback(async (data: {
    portfolio_id: string;
    coin_id: string;
    type: "buy" | "sell" | "transfer";
    amount: string;
    total: string;
    currency: string;
    exchange_rate?: string;
    note?: string;
  }): Promise<PortfolioTransaction | null> => {
    setIsAddingTransaction(true);
    try {
      const result = await addTransaction(data);
      return result;
    } catch (error) {
      console.error("Failed to add transaction:", error);
      throw error;
    } finally {
      setIsAddingTransaction(false);
    }
  }, []);

  return {
    create,
    update,
    remove,
    addTransaction: addTx,
    isCreating,
    isUpdating,
    isDeleting,
    isAddingTransaction,
  };
}

/**
 * Combined hook for portfolio page
 * @returns All portfolio data and mutations
 */
export function usePortfolioPage() {
  const { portfolios, isLoading, error, refresh } = usePortfolios();
  const mutations = usePortfolioMutations();

  return {
    portfolios,
    isLoading,
    error,
    refresh,
    ...mutations,
  };
}
