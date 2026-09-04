export type GroceryCategory =
  | "produce"
  | "dairy"
  | "meat"
  | "seafood"
  | "bakery"
  | "frozen"
  | "pantry"
  | "other";

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  "produce",
  "dairy",
  "meat",
  "seafood",
  "bakery",
  "frozen",
  "pantry",
  "other",
];

export type Cuisine =
  | "American"
  | "Italian"
  | "Asian"
  | "Indian"
  | "Mediterranean"
  | "Mexican";

export interface Grocery {
  id: string;
  name: string;
  category: GroceryCategory;
  quantity: number;
  unit: string;
  purchase_date: string; // ISO date (YYYY-MM-DD)
  expiry_date: string; // ISO date (YYYY-MM-DD)
  used: boolean;
  notes: string | null;
  created_at: string | null;
}

export interface NewGrocery {
  name: string;
  category: GroceryCategory;
  quantity: number;
  unit: string;
  purchase_date: string;
  expiry_date?: string | null;
  notes?: string | null;
}

export interface RecipeIngredient {
  name: string;
  quantity_text: string;
  optional: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: Cuisine | string;
  prep_time_minutes: number;
  servings: number;
  instructions: string;
  ingredients: RecipeIngredient[];
  meal_type?: string | null;
  diet?: string | null;
  region?: string | null;
  difficulty?: string | null;
  spice_level?: string | null;
}

export interface MatchedIngredient {
  ingredient: RecipeIngredient;
  grocery: Grocery;
  days_until_expiry: number;
  urgency: number;
}

export interface Suggestion {
  recipe: Recipe;
  score: number;
  matched_ingredients: MatchedIngredient[];
  matched_expiring_ingredients: MatchedIngredient[];
  missing_ingredients: RecipeIngredient[];
  reason: string;
}
