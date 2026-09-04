"use client";

import { useState } from "react";
import { ChefHat, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeDialog } from "@/components/RecipeDialog";
import type { Suggestion } from "@/lib/types";

interface SuggestionsListProps {
  suggestions: Suggestion[];
  hasActiveGroceries: boolean;
  loading: boolean;
  error: string | null;
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-accent p-3 text-accent-foreground">{icon}</div>
      <p className="font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
    </div>
  );
}

export function SuggestionsList({ suggestions, hasActiveGroceries, loading, error }: SuggestionsListProps) {
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);

  const view = (s: Suggestion) => {
    setSelected(s);
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Suggested meals</CardTitle>
        <CardDescription>
          Ranked by how well each recipe uses up what&apos;s about to expire. Updates instantly as your groceries change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((n) => (
              <div key={n} className="h-56 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : !hasActiveGroceries ? (
          <EmptyState
            icon={<ChefHat className="h-6 w-6" />}
            title="Log a few groceries to get recipe suggestions"
            body="Once you've added what's in your fridge, we'll rank recipes that use the items closest to expiring."
          />
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="No great matches yet — try logging a few more staple ingredients."
            body="Eggs, onion, garlic, rice, pasta, tomato and cheese unlock a lot of recipes."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {suggestions.map((s, idx) => (
              <RecipeCard key={s.recipe.id} suggestion={s} rank={idx + 1} onView={view} />
            ))}
          </div>
        )}
      </CardContent>

      <RecipeDialog suggestion={selected} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
