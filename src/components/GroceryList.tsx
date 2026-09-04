"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ShoppingBasket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { GroceryRow } from "@/components/GroceryRow";
import type { Grocery } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GroceryListProps {
  active: Grocery[];
  used: Grocery[];
  loading: boolean;
  error: string | null;
  onToggleUsed: (id: string, used: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const LEGEND = [
  { dot: "bg-red-500", label: "Expired" },
  { dot: "bg-orange-500", label: "0–2 days" },
  { dot: "bg-yellow-500", label: "3–5 days" },
  { dot: "bg-green-500", label: "> 5 days" },
];

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Item</th>
            <th className="px-4 py-2.5 font-medium">Category</th>
            <th className="px-4 py-2.5 font-medium">Qty</th>
            <th className="px-4 py-2.5 font-medium">Expires</th>
            <th className="px-4 py-2.5 font-medium">Days left</th>
            <th className="px-4 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function GroceryList({ active, used, loading, error, onToggleUsed, onDelete }: GroceryListProps) {
  const [showUsed, setShowUsed] = useState(false);

  const handleToggle = async (id: string, next: boolean) => {
    try {
      await onToggleUsed(id, next);
      toast(next ? "Marked as used" : "Moved back to your groceries");
    } catch (err) {
      toast.error("Update failed", { description: err instanceof Error ? err.message : undefined });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast("Grocery deleted");
    } catch (err) {
      toast.error("Delete failed", { description: err instanceof Error ? err.message : undefined });
    }
  };

  const total = active.length + used.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Your groceries</CardTitle>
            <CardDescription className="mt-1.5">
              Sorted by expiry — soonest first.{" "}
              {active.length > 0 && `${active.length} active item${active.length === 1 ? "" : "s"}.`}
            </CardDescription>
          </div>
          <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {LEGEND.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", l.dot)} /> {l.label}
              </li>
            ))}
          </ul>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((n) => (
              <div key={n} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
            <div className="mb-3 rounded-full bg-accent p-3 text-accent-foreground">
              <ShoppingBasket className="h-6 w-6" />
            </div>
            <p className="font-medium">Nothing in your kitchen yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Log your first grocery above. We&apos;ll track when it expires and suggest recipes that use it up in time.
            </p>
          </div>
        ) : (
          <>
            {active.length === 0 ? (
              <div className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
                Everything has been used up — nice work! Log something new to get fresh suggestions.
              </div>
            ) : (
              <TableShell>
                {active.map((g) => (
                  <GroceryRow key={g.id} grocery={g} onToggleUsed={handleToggle} onDelete={handleDelete} />
                ))}
              </TableShell>
            )}

            {used.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowUsed((s) => !s)}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  aria-expanded={showUsed}
                >
                  {showUsed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Used items ({used.length})
                </button>
                {showUsed && (
                  <TableShell>
                    {used.map((g) => (
                      <GroceryRow key={g.id} grocery={g} onToggleUsed={handleToggle} onDelete={handleDelete} />
                    ))}
                  </TableShell>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
