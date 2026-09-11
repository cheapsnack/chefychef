"use client";

import { useState } from "react";
import { ClipboardList, Clock, CookingPot, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import type { Suggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeDialogProps {
  suggestion: Suggestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Marks several groceries used / unused at once (backed by the existing setUsed server call). */
  onMarkUsed?: (ids: string[], used: boolean) => Promise<void>;
}

export function RecipeDialog({ suggestion, open, onOpenChange, onMarkUsed }: RecipeDialogProps) {
  const [cooking, setCooking] = useState(false);

  if (!suggestion) return null;
  const { recipe, matched_ingredients, matched_expiring_ingredients, missing_ingredients } = suggestion;

  const matchedNames = new Set(matched_ingredients.map((m) => m.ingredient.name));
  const expiringNames = new Set(matched_expiring_ingredients.map((m) => m.ingredient.name));

  // matched_ingredients already contains the expiring matches, but we de-dupe by
  // grocery id anyway so one grocery matched by two ingredients is only toggled once.
  const cookTargets = Array.from(
    new Map(matched_ingredients.map((m) => [m.grocery.id, m.grocery])).values(),
  );

  const steps = recipe.instructions
    .split(/\n+/)
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  const handleCook = async () => {
    if (cookTargets.length === 0 || !onMarkUsed) return;
    const ids = cookTargets.map((g) => g.id);
    const names = cookTargets.map((g) => g.name);
    setCooking(true);
    try {
      await onMarkUsed(ids, true);
      toast.success(`Marked ${ids.length} item${ids.length === 1 ? "" : "s"} used`, {
        description: names.join(", "),
        action: {
          label: "Undo",
          onClick: () => {
            void onMarkUsed(ids, false).catch(() =>
              toast.error("Couldn't undo", { description: "Please try again." }),
            );
          },
        },
      });
    } catch (err) {
      toast.error("Couldn't mark items used", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setCooking(false);
    }
  };

  const handleCopyShoppingList = async () => {
    const text = missing_ingredients.map((ing) => `${ing.quantity_text} ${ing.name}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Shopping list copied", {
        description: `${missing_ingredients.length} ingredient${missing_ingredients.length === 1 ? "" : "s"}`,
      });
    } catch {
      toast.error("Couldn't copy", { description: "Your browser blocked clipboard access." });
    }
  };

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

        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              {/* span wrapper: a disabled button doesn't emit the events the tooltip needs */}
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button onClick={handleCook} disabled={cookTargets.length === 0 || cooking}>
                    {cooking ? <Loader2 className="animate-spin" /> : <CookingPot />} Cook this
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {cookTargets.length === 0
                  ? "You don't have any of these ingredients logged yet."
                  : `Marks ${cookTargets.length} matched grocer${cookTargets.length === 1 ? "y" : "ies"} as used.`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {missing_ingredients.length > 0 && (
            <Button variant="outline" onClick={handleCopyShoppingList}>
              <ClipboardList /> Copy shopping list
            </Button>
          )}
        </div>

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
