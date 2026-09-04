"use client";

import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Suggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeDialogProps {
  suggestion: Suggestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDialog({ suggestion, open, onOpenChange }: RecipeDialogProps) {
  if (!suggestion) return null;
  const { recipe, matched_ingredients, matched_expiring_ingredients } = suggestion;

  const matchedNames = new Set(matched_ingredients.map((m) => m.ingredient.name));
  const expiringNames = new Set(matched_expiring_ingredients.map((m) => m.ingredient.name));

  const steps = recipe.instructions
    .split(/\n+/)
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{recipe.cuisine}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {recipe.prep_time_minutes} min
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Serves {recipe.servings}
            </span>
          </div>
          <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
          <DialogDescription>{suggestion.reason}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</h4>
            <ul className="space-y-1.5 text-sm">
              {recipe.ingredients.map((ing) => {
                const matched = matchedNames.has(ing.name);
                const expiring = expiringNames.has(ing.name);
                return (
                  <li key={ing.name} className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        expiring ? "bg-orange-500" : matched ? "bg-green-500" : "bg-muted-foreground/30",
                      )}
                      aria-hidden
                    />
                    <span className={cn(!matched && !ing.optional && "text-muted-foreground")}>
                      <span className="capitalize">{ing.name}</span>
                      <span className="text-muted-foreground"> — {ing.quantity_text}</span>
                      {ing.optional && <span className="ml-1 text-xs italic text-muted-foreground">(optional)</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-orange-500 align-middle" /> expiring soon ·{" "}
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 align-middle" /> you have it ·{" "}
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30 align-middle" /> missing
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Instructions</h4>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
              {steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
