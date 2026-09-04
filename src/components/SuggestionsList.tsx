"use client";

import { useMemo, useState } from "react";
import { ChefHat, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeDialog } from "@/components/RecipeDialog";
import type { Suggestion } from "@/lib/types";

interface SuggestionsListProps {
  suggestions: Suggestion[];
  hasActiveGroceries: boolean;
  loading: boolean;
  error: string | null;
}

const ALL = "all";
const DISPLAY_COUNT = 6;

interface Filters {
  diet: string;
  mealType: string;
  spice: string;
}

const EMPTY_FILTERS: Filters = { diet: ALL, mealType: ALL, spice: ALL };

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-accent p-3 text-accent-foreground">{icon}</div>
      <p className="font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
    </div>
  );
}

function label(value: string): string {
  return value
    .split(/[-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function SuggestionsList({ suggestions, hasActiveGroceries, loading, error }: SuggestionsListProps) {
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  // Build dropdown options from whatever tags exist in the suggestion pool.
  const options = useMemo(() => {
    const collect = (pick: (s: Suggestion) => string | null | undefined) =>
      Array.from(new Set(suggestions.map(pick).filter((v): v is string => !!v))).sort();
    return {
      diet: collect((s) => s.recipe.diet),
      mealType: collect((s) => s.recipe.meal_type),
      spice: collect((s) => s.recipe.spice_level),
    };
  }, [suggestions]);

  const filtersActive =
    filters.diet !== ALL || filters.mealType !== ALL || filters.spice !== ALL;

  const filtered = useMemo(
    () =>
      suggestions
        .filter(
          (s) =>
            (filters.diet === ALL || s.recipe.diet === filters.diet) &&
            (filters.mealType === ALL || s.recipe.meal_type === filters.mealType) &&
            (filters.spice === ALL || s.recipe.spice_level === filters.spice),
        )
        .slice(0, DISPLAY_COUNT),
    [suggestions, filters],
  );

  const view = (s: Suggestion) => {
    setSelected(s);
    setOpen(true);
  };

  const set = (key: keyof Filters) => (value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const showFilters = hasActiveGroceries && !loading && suggestions.length > 0 && !error;

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

        {showFilters && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-3 py-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </span>
            <Select value={filters.diet} onValueChange={set("diet")}>
              <SelectTrigger className="w-[150px] bg-background" aria-label="Diet filter">
                <SelectValue placeholder="Diet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any diet</SelectItem>
                {options.diet.map((d) => (
                  <SelectItem key={d} value={d}>{label(d)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.mealType} onValueChange={set("mealType")}>
              <SelectTrigger className="w-[150px] bg-background" aria-label="Meal type filter">
                <SelectValue placeholder="Meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any meal</SelectItem>
                {options.mealType.map((m) => (
                  <SelectItem key={m} value={m}>{label(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.spice} onValueChange={set("spice")}>
              <SelectTrigger className="w-[150px] bg-background" aria-label="Spice level filter">
                <SelectValue placeholder="Spice level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any spice</SelectItem>
                {options.spice.map((s) => (
                  <SelectItem key={s} value={s}>{label(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                <X /> Clear
              </Button>
            )}
          </div>
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
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal className="h-6 w-6" />}
            title="No suggestions match these filters"
            body="Try loosening a filter or clearing them to see all ranked suggestions."
          />
        ) : (
          <>
            {filtersActive && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                Showing {filtered.length} match{filtered.length === 1 ? "" : "es"}
                {filters.diet !== ALL && <Badge variant="secondary">{label(filters.diet)}</Badge>}
                {filters.mealType !== ALL && <Badge variant="secondary">{label(filters.mealType)}</Badge>}
                {filters.spice !== ALL && <Badge variant="secondary">{label(filters.spice)} spice</Badge>}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s, idx) => (
                <RecipeCard key={s.recipe.id} suggestion={s} rank={idx + 1} onView={view} />
              ))}
            </div>
          </>
        )}
      </CardContent>

      <RecipeDialog suggestion={selected} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
