/**
 * Data client used by the hooks.
 *
 * Talks to the Lovable Cloud database directly from the browser using the
 * generated client. Row-level security policies on `groceries` and `recipes`
 * intentionally allow public access (single-user demo, no accounts).
 */
import { supabase } from "@/integrations/supabase/client";
import type { Grocery, NewGrocery, Recipe } from "@/lib/types";

export const api = {
  async listGroceries(): Promise<Grocery[]> {
    const { data, error } = await supabase.from("groceries").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Grocery[];
  },

  async insertGrocery(payload: NewGrocery & { expiry_date: string }): Promise<Grocery> {
    const { data, error } = await supabase.from("groceries").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as unknown as Grocery;
  },

  async updateGrocery(
    id: string,
    patch: Partial<Omit<Grocery, "id" | "created_at">>,
  ): Promise<Grocery> {
    const { data, error } = await supabase
      .from("groceries")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Grocery;
  },

  async deleteGrocery(id: string): Promise<{ id: string }> {
    const { error } = await supabase.from("groceries").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { id };
  },

  async listRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase.from("recipes").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Recipe[];
  },
};
