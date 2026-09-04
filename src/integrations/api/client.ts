/**
 * Data client used by the hooks.
 *
 * Groceries are private per visitor: they go through server functions that
 * resolve an anonymous kitchen id from an encrypted http-only cookie and scope
 * every query to it. The browser has no direct access to the table.
 *
 * Recipes are shared, public, read-only content and are read straight from the
 * database with the publishable key (SELECT-only policy).
 */
import { supabase } from "@/integrations/supabase/client";
import {
  deleteGroceryFn,
  insertGroceryFn,
  listGroceriesFn,
  updateGroceryFn,
} from "@/lib/groceries.functions";
import type { Grocery, NewGrocery, Recipe } from "@/lib/types";

export const api = {
  async listGroceries(): Promise<Grocery[]> {
    return await listGroceriesFn();
  },

  async insertGrocery(payload: NewGrocery & { expiry_date: string }): Promise<Grocery> {
    return await insertGroceryFn({ data: payload });
  },

  async updateGrocery(
    id: string,
    patch: Partial<Omit<Grocery, "id" | "created_at">>,
  ): Promise<Grocery> {
    return await updateGroceryFn({ data: { id, ...patch } });
  },

  async deleteGrocery(id: string): Promise<{ id: string }> {
    return await deleteGroceryFn({ data: { id } });
  },

  async listRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase.from("recipes").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Recipe[];
  },
};
