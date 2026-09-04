"use client";

import { AlertTriangle, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Suggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  suggestion: Suggestion;
  rank: number;
  onView: (suggestion: Suggestion) => void;
}

const CUISINE_COLORS: Record<string, string> = {
  American: "bg-blue-100 text-blue-800 border-blue-200",
  Italian: "bg-green-100 text-green-800 border-green-200",
  Asian: "bg-red-100 text-red-800 border-red-200",
  Indian: "bg-orange-100 text-orange-800 border-orange-200",
  Mediterranean: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Mexican: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function RecipeCard({ suggestion, rank, onView }: RecipeCardProps) {
  const { recipe, reason, matched_expiring_ingredients, matched_ingredients, missing_ingredients, score } = suggestion;
  const expiringSet = new Set(matched_expiring_ingredients.map((m) => m.ingredient.name));
  const otherMatched = matched_ingredients.filter((m) => !expiringSet.has(m.ingredient.name));
  const hasExpiring = matched_expiring_ingredients.length > 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={cn(CUISINE_COLORS[recipe.cuisine] ?? "")}>
            {recipe.cuisine}
          </Badge>
          <span className="text-xs text-muted-foreground">#{rank} · score {score}</span>
        </div>
        <CardTitle className="text-lg leading-snug">{recipe.name}</CardTitle>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {recipe.prep_time_minutes} min · serves {recipe.servings}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium",
            hasExpiring ? "bg-orange-50 text-orange-900" : "bg-accent text-accent-foreground",
          )}
        >
          {hasExpiring && <AlertTriangle className="mr-1.5 inline h-4 w-4 -translate-y-px text-orange-600" />}
          {reason}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {matched_expiring_ingredients.map((m) => (
            <span
              key={`exp-${m.ingredient.name}`}
              className="rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-xs font-medium capitalize text-orange-900"
              title={`${m.grocery.name} · ${m.days_until_expiry < 0 ? "expired" : `${m.days_until_expiry}d left`}`}
            >
              {m.ingredient.name}
            </span>
          ))}
          {otherMatched.map((m) => (
            <span
              key={`ok-${m.ingredient.name}`}
              className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs capitalize text-green-800"
              title={`You have: ${m.grocery.name}`}
            >
              {m.ingredient.name}
            </span>
          ))}
          {missing_ingredients.map((ing) => (
            <span
              key={`miss-${ing.name}`}
              className="rounded-full border border-dashed border-muted-foreground/30 bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground line-through decoration-muted-foreground/50"
              title="Missing — you'd need to buy this"
            >
              {ing.name}
            </span>
          ))}
        </div>
        {missing_ingredients.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Missing {missing_ingredients.length} ingredient{missing_ingredients.length === 1 ? "" : "s"}.
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full" onClick={() => onView(suggestion)}>
          <BookOpen /> View recipe
        </Button>
      </CardFooter>
    </Card>
  );
}
