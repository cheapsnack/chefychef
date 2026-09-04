"use client";

import { useMemo } from "react";
import { suggestRecipes } from "@/lib/scoring";
import type { Grocery, Recipe, Suggestion } from "@/lib/types";

/**
 * Minimum score for a recipe to be considered a "reasonable" suggestion.
 * Chosen so that a recipe matching at least one non-urgent staple with one
 * missing ingredient (1 − 1.5 = −0.5) is filtered out, while any recipe
 * that matches more than it misses shows up.
 */
export const MIN_SUGGESTION_SCORE = 0;

/**
 * Suggestions are derived purely from groceries + recipes via useMemo, so
 * they recompute automatically on every insert / update / delete.
 */
export function useSuggestions(groceries: Grocery[], recipes: Recipe[], limit = 5): Suggestion[] {
  return useMemo(
    () => suggestRecipes(groceries, recipes, { limit, minScore: MIN_SUGGESTION_SCORE }),
    [groceries, recipes, limit],
  );
}
