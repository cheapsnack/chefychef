"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/integrations/api/client";
import { estimateExpiryDate } from "@/lib/shelfLife";
import type { Grocery, NewGrocery } from "@/lib/types";

function sortByExpiry(list: Grocery[]): Grocery[] {
  return [...list].sort((a, b) => {
    if (a.expiry_date !== b.expiry_date) return a.expiry_date < b.expiry_date ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function useGroceries() {
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await api.listGroceries();
      setGroceries(sortByExpiry(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groceries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Inserts a grocery. If expiry_date is blank, it is auto-estimated from
   * purchase_date + shelf life for the category. Returns the saved row.
   */
  const addGrocery = useCallback(async (input: NewGrocery): Promise<Grocery> => {
    const expiry_date =
      input.expiry_date && input.expiry_date.trim()
        ? input.expiry_date
        : estimateExpiryDate(input.purchase_date, input.category);
    const saved = await api.insertGrocery({ ...input, expiry_date });
    setGroceries((prev) => sortByExpiry([...prev, saved]));
    return saved;
  }, []);

  const setUsed = useCallback(async (id: string, used: boolean) => {
    // Optimistic update, rolled back on failure.
    let previous: Grocery | undefined;
    setGroceries((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        previous = g;
        return { ...g, used };
      }),
    );
    try {
      const saved = await api.updateGrocery(id, { used });
      setGroceries((prev) => sortByExpiry(prev.map((g) => (g.id === id ? saved : g))));
    } catch (err) {
      if (previous) {
        const rollback = previous;
        setGroceries((prev) => prev.map((g) => (g.id === id ? rollback : g)));
      }
      throw err;
    }
  }, []);

  const deleteGrocery = useCallback(async (id: string) => {
    let removed: Grocery | undefined;
    setGroceries((prev) => {
      removed = prev.find((g) => g.id === id);
      return prev.filter((g) => g.id !== id);
    });
    try {
      await api.deleteGrocery(id);
    } catch (err) {
      if (removed) {
        const restore = removed;
        setGroceries((prev) => sortByExpiry([...prev, restore]));
      }
      throw err;
    }
  }, []);

  const active = useMemo(() => groceries.filter((g) => !g.used), [groceries]);
  const used = useMemo(() => groceries.filter((g) => g.used), [groceries]);

  return { groceries, active, used, loading, error, refresh, addGrocery, setUsed, deleteGrocery };
}
