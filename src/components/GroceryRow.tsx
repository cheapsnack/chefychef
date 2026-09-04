"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Grocery } from "@/lib/types";
import { daysUntilExpiry, parseISODate } from "@/lib/shelfLife";

interface GroceryRowProps {
  grocery: Grocery;
  onToggleUsed: (id: string, used: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/** Colour band by days until expiry: red < 0, orange 0–2, yellow 3–5, green > 5. */
export function expiryTone(days: number) {
  if (days < 0) {
    return { row: "bg-red-50 hover:bg-red-100/70", dot: "bg-red-500", text: "text-red-700", label: "Expired" };
  }
  if (days <= 2) {
    return { row: "bg-orange-50 hover:bg-orange-100/70", dot: "bg-orange-500", text: "text-orange-700", label: "Use now" };
  }
  if (days <= 5) {
    return { row: "bg-yellow-50 hover:bg-yellow-100/70", dot: "bg-yellow-500", text: "text-yellow-700", label: "Use soon" };
  }
  return { row: "bg-green-50 hover:bg-green-100/70", dot: "bg-green-500", text: "text-green-700", label: "Fresh" };
}

export function daysLeftLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

const CATEGORY_BADGE: Record<Grocery["category"], string> = {
  produce: "bg-emerald-100 text-emerald-800 border-emerald-200",
  dairy: "bg-sky-100 text-sky-800 border-sky-200",
  meat: "bg-rose-100 text-rose-800 border-rose-200",
  seafood: "bg-cyan-100 text-cyan-800 border-cyan-200",
  bakery: "bg-amber-100 text-amber-800 border-amber-200",
  frozen: "bg-indigo-100 text-indigo-800 border-indigo-200",
  pantry: "bg-stone-100 text-stone-800 border-stone-200",
  other: "bg-slate-100 text-slate-800 border-slate-200",
};

function formatQuantity(q: number): string {
  return Number.isInteger(q) ? String(q) : String(Math.round(q * 100) / 100);
}

export function GroceryRow({ grocery, onToggleUsed, onDelete }: GroceryRowProps) {
  const [busy, setBusy] = useState<"used" | "delete" | null>(null);
  const days = daysUntilExpiry(grocery.expiry_date);
  const tone = expiryTone(days);

  const run = async (kind: "used" | "delete", fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <tr
      className={cn(
        "border-b transition-colors last:border-b-0",
        grocery.used ? "bg-muted/40 text-muted-foreground opacity-60" : tone.row,
      )}
    >
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          {!grocery.used && <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tone.dot)} aria-hidden />}
          <div className="min-w-0">
            <div className={cn("font-medium capitalize", grocery.used && "line-through")}>{grocery.name}</div>
            {grocery.notes && <div className="truncate text-xs text-muted-foreground">{grocery.notes}</div>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <Badge variant="outline" className={cn("capitalize", CATEGORY_BADGE[grocery.category])}>
          {grocery.category}
        </Badge>
      </td>
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        {formatQuantity(grocery.quantity)} {grocery.unit}
      </td>
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        {parseISODate(grocery.expiry_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </td>
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        {grocery.used ? (
          <span className="text-xs">Used</span>
        ) : (
          <span className={cn("font-medium", tone.text)}>
            {daysLeftLabel(days)}
            <span className="ml-1.5 text-xs font-normal opacity-80">· {tone.label}</span>
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant={grocery.used ? "ghost" : "outline"}
            disabled={busy !== null}
            onClick={() => run("used", () => onToggleUsed(grocery.id, !grocery.used))}
            title={grocery.used ? "Move back to active" : "Mark as used"}
          >
            {busy === "used" ? <Loader2 className="animate-spin" /> : grocery.used ? <RotateCcw /> : <CheckCircle2 />}
            <span className="hidden sm:inline">{grocery.used ? "Restore" : "Mark used"}</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy !== null} title="Delete">
                {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />}
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {grocery.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the item permanently. If you ate it, &quot;Mark used&quot; keeps a record instead.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => void run("delete", () => onDelete(grocery.id))}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}
