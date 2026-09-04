"use client";

import { Leaf } from "lucide-react";
import { GroceryForm } from "@/components/GroceryForm";
import { GroceryList } from "@/components/GroceryList";
import { SuggestionsList } from "@/components/SuggestionsList";
import { useGroceries } from "@/hooks/useGroceries";
import { useRecipes } from "@/hooks/useRecipes";
import { useSuggestions } from "@/hooks/useSuggestions";
import { daysUntilExpiry } from "@/lib/shelfLife";

/**
 * The single main page: composes the three sections in order.
 * Suggestions are derived from (groceries, recipes) so any insert / update /
 * delete in useGroceries recomputes them automatically.
 */
export default function Index() {
  const groceriesState = useGroceries();
  const recipesState = useRecipes();
  // Larger pool so tag filters still leave enough suggestions to show.
  const suggestions = useSuggestions(groceriesState.groceries, recipesState.recipes, 24);

  const expiringSoon = groceriesState.active.filter((g) => daysUntilExpiry(g.expiry_date) <= 3).length;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Smart Meal Planner</h1>
              <p className="text-sm text-muted-foreground">Cook what&apos;s expiring first. Waste less.</p>
            </div>
          </div>
          {!groceriesState.loading && groceriesState.active.length > 0 && (
            <div className="hidden text-right text-sm sm:block">
              <div className="font-semibold">{groceriesState.active.length} items tracked</div>
              <div className={expiringSoon > 0 ? "text-orange-700" : "text-muted-foreground"}>
                {expiringSoon > 0
                  ? `${expiringSoon} expiring within 3 days`
                  : "Nothing expiring in the next 3 days"}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <section id="log" aria-labelledby="log-heading">
          <GroceryForm onAdd={groceriesState.addGrocery} />
        </section>

        <section id="groceries" aria-labelledby="groceries-heading">
          <GroceryList
            active={groceriesState.active}
            used={groceriesState.used}
            loading={groceriesState.loading}
            error={groceriesState.error}
            onToggleUsed={groceriesState.setUsed}
            onDelete={groceriesState.deleteGrocery}
          />
        </section>

        <section id="suggestions" aria-labelledby="suggestions-heading">
          <SuggestionsList
            suggestions={suggestions}
            hasActiveGroceries={groceriesState.active.length > 0}
            loading={groceriesState.loading || recipesState.loading}
            error={recipesState.error}
          />
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-muted-foreground sm:px-6">
        Shelf-life estimates are rough averages for reminders only — not food-safety guidance.
      </footer>
    </div>
  );
}
