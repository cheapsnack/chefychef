"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { GROCERY_CATEGORIES, type Grocery, type GroceryCategory, type NewGrocery } from "@/lib/types";
import { SHELF_LIFE_DAYS, estimateExpiryDate, parseISODate, todayISO } from "@/lib/shelfLife";

interface GroceryFormProps {
  onAdd: (input: NewGrocery) => Promise<Grocery>;
}

interface FormState {
  name: string;
  category: GroceryCategory;
  quantity: string;
  unit: string;
  purchase_date: string;
  expiry_date: string;
  notes: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const initialState = (): FormState => ({
  name: "",
  category: "produce",
  quantity: "1",
  unit: "pcs",
  purchase_date: todayISO(),
  expiry_date: "",
  notes: "",
});

function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function GroceryForm({ onAdd }: GroceryFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Name is required.";
    const q = Number(form.quantity);
    if (!Number.isFinite(q) || q <= 0) e.quantity = "Quantity must be a positive number.";
    if (!form.purchase_date) e.purchase_date = "Purchase date is required.";
    if (form.expiry_date && form.purchase_date && form.expiry_date < form.purchase_date) {
      e.expiry_date = "Expiry date can't be before the purchase date.";
    }
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      const wasAutoEstimated = !form.expiry_date;
      const saved = await onAdd({
        name: form.name.trim(),
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit.trim() || "pcs",
        purchase_date: form.purchase_date,
        expiry_date: form.expiry_date || null,
        notes: form.notes.trim() || null,
      });
      toast.success(`Added ${saved.name}`, {
        description: `${wasAutoEstimated ? "Estimated expiry" : "Expires"}: ${formatDate(saved.expiry_date)}${
          wasAutoEstimated ? ` (${SHELF_LIFE_DAYS[saved.category]}-day ${saved.category} shelf life)` : ""
        }`,
      });
      setForm((f) => ({ ...initialState(), category: f.category, unit: f.unit }));
    } catch (err) {
      toast.error("Couldn't add grocery", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const previewExpiry =
    !form.expiry_date && form.purchase_date ? estimateExpiryDate(form.purchase_date, form.category) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Log a grocery</CardTitle>
        <CardDescription>
          Add something you bought. Leave the expiry date blank and we&apos;ll estimate it from the category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4 md:grid-cols-2">
          <FormField name="name" error={errors.name}>
            <FormItem className="md:col-span-2">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. spinach, milk, chicken breast"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="category" error={errors.category}>
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={form.category} onValueChange={(v) => set("category", v as GroceryCategory)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GROCERY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c} <span className="ml-1 text-muted-foreground">· ~{SHELF_LIFE_DAYS[c]}d</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField name="quantity" error={errors.quantity}>
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={form.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField name="unit" error={errors.unit}>
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder="pcs" value={form.unit} onChange={(e) => set("unit", e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <FormField name="purchase_date" error={errors.purchase_date}>
            <FormItem>
              <FormLabel>Purchase date</FormLabel>
              <FormControl>
                <Input type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="expiry_date" error={errors.expiry_date}>
            <FormItem>
              <FormLabel>
                Expiry date <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="auto-estimated if left blank"
                  title="auto-estimated if left blank"
                  value={form.expiry_date}
                  min={form.purchase_date || undefined}
                  onChange={(e) => set("expiry_date", e.target.value)}
                />
              </FormControl>
              <FormDescription>
                {previewExpiry
                  ? `Auto-estimated if left blank → ${formatDate(previewExpiry)}`
                  : "Auto-estimated if left blank."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="notes" error={errors.notes}>
            <FormItem className="md:col-span-2">
              <FormLabel>
                Notes <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. opened on Tuesday, half left"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus />}
              Add grocery
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
