/**
 * Recipe suggestion algorithm — pure TypeScript, no React or network deps.
 *
 * Steps:
 *  1. For each unused grocery compute days_until_expiry (may be negative).
 *  2. urgency = max(1, 10 - days_until_expiry)
 *  3. Match each recipe ingredient to a grocery: case-insensitive substring
 *     match first, then Dice's coefficient similarity >= 0.8 as a fallback.
 *  4. score = Σ urgency(matched required) + 0.5 · Σ urgency(matched optional)
 *             − 1.5 · (# unmatched required)
 *  5. Sort by score desc, return top N (default 5).
 */
import type {
  Grocery,
  MatchedIngredient,
  Recipe,
  RecipeIngredient,
  Suggestion,
} from "./types";
import { daysUntilExpiry, todayISO } from "./shelfLife";

export const EXPIRING_SOON_DAYS = 3;
export const SIMILARITY_THRESHOLD = 0.8;

export function urgencyFor(daysUntil: number): number {
  return Math.max(1, 10 - daysUntil);
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function bigrams(s: string): Map<string, number> {
  const map = new Map<string, number>();
  const str = s.replace(/\s+/g, "");
  for (let i = 0; i < str.length - 1; i++) {
    const bg = str.slice(i, i + 2);
    map.set(bg, (map.get(bg) ?? 0) + 1);
  }
  return map;
}

/**
 * Dice's coefficient on character bigrams: 2·|A∩B| / (|A| + |B|), in [0, 1].
 */
export function diceCoefficient(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;
  const ba = bigrams(na);
  const bb = bigrams(nb);
  let intersection = 0;
  let sizeA = 0;
  let sizeB = 0;
  for (const [, c] of ba) sizeA += c;
  for (const [, c] of bb) sizeB += c;
  for (const [bg, countA] of ba) {
    const countB = bb.get(bg);
    if (countB) intersection += Math.min(countA, countB);
  }
  return (2 * intersection) / (sizeA + sizeB);
}

/** Substring match in either direction, case-insensitive. */
export function substringMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

export function ingredientMatchesGrocery(
  ingredientName: string,
  groceryName: string,
): boolean {
  if (substringMatch(ingredientName, groceryName)) return true;
  return diceCoefficient(ingredientName, groceryName) >= SIMILARITY_THRESHOLD;
}

interface ScoredGrocery {
  grocery: Grocery;
  days_until_expiry: number;
  urgency: number;
}

function prepareGroceries(groceries: Grocery[], today: string): ScoredGrocery[] {
  return groceries
    .filter((g) => !g.used)
    .map((g) => {
      const days = daysUntilExpiry(g.expiry_date, today);
      return { grocery: g, days_until_expiry: days, urgency: urgencyFor(days) };
    });
}

/**
 * Finds the best grocery for an ingredient. Prefer substring matches (and
 * among them, the most urgent grocery) before falling back to fuzzy matches.
 */
function findMatch(
  ingredient: RecipeIngredient,
  pool: ScoredGrocery[],
): ScoredGrocery | null {
  let best: ScoredGrocery | null = null;
  for (const sg of pool) {
    if (substringMatch(ingredient.name, sg.grocery.name)) {
      if (!best || sg.urgency > best.urgency) best = sg;
    }
  }
  if (best) return best;

  let bestSim = 0;
  for (const sg of pool) {
    const sim = diceCoefficient(ingredient.name, sg.grocery.name);
    if (sim >= SIMILARITY_THRESHOLD && (sim > bestSim || (sim === bestSim && best && sg.urgency > best.urgency))) {
      best = sg;
      bestSim = sim;
    }
  }
  return best;
}

function formatList(names: string[]): string {
  return names.join(", ");
}

export function buildReason(
  expiring: MatchedIngredient[],
  matched: MatchedIngredient[],
): string {
  // De-duplicate by grocery name so two ingredients hitting the same grocery
  // don't double-count in the sentence.
  const names = Array.from(new Set(expiring.map((m) => m.grocery.name.toLowerCase())));
  const count = names.length;
  if (count === 0) {
    return matched.length > 0
      ? "Good match using what you have on hand."
      : "You'd need to shop for everything in this one.";
  }
  if (count === 1) {
    return `Uses 1 item expiring within ${EXPIRING_SOON_DAYS} days: ${names[0]}.`;
  }
  return `Uses ${count} items expiring within ${EXPIRING_SOON_DAYS} days: ${formatList(names)}.`;
}

export function scoreRecipe(
  recipe: Recipe,
  pool: ScoredGrocery[],
): Suggestion {
  const matched: MatchedIngredient[] = [];
  const missing: RecipeIngredient[] = [];
  let score = 0;

  for (const ingredient of recipe.ingredients) {
    const match = findMatch(ingredient, pool);
    if (match) {
      matched.push({
        ingredient,
        grocery: match.grocery,
        days_until_expiry: match.days_until_expiry,
        urgency: match.urgency,
      });
      score += ingredient.optional ? 0.5 * match.urgency : match.urgency;
    } else if (!ingredient.optional) {
      missing.push(ingredient);
      score -= 1.5;
    }
  }

  const expiring = matched.filter((m) => m.days_until_expiry <= EXPIRING_SOON_DAYS);

  return {
    recipe,
    score: Math.round(score * 100) / 100,
    matched_ingredients: matched,
    matched_expiring_ingredients: expiring,
    missing_ingredients: missing,
    reason: buildReason(expiring, matched),
  };
}

export interface SuggestOptions {
  limit?: number;
  today?: string; // ISO date; injectable for tests
  minScore?: number; // suggestions below this are dropped
}

export function suggestRecipes(
  groceries: Grocery[],
  recipes: Recipe[],
  options: SuggestOptions = {},
): Suggestion[] {
  const { limit = 5, today = todayISO(), minScore = Number.NEGATIVE_INFINITY } = options;
  const pool = prepareGroceries(groceries, today);
  if (pool.length === 0) return [];

  return recipes
    .map((r) => scoreRecipe(r, pool))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name))
    .slice(0, limit);
}
