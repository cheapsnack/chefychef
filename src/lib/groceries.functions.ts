/**
 * Server functions backing the grocery list.
 *
 * Each visitor gets an anonymous "kitchen id" stored in an encrypted, http-only
 * session cookie. Every grocery row is stamped with that id and all reads and
 * writes are scoped to it server-side, so the browser can never address another
 * visitor's rows. The `groceries` table itself is unreachable from the browser
 * (RLS on, no policies, no anon/authenticated grants).
 */
import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import type { Grocery } from "@/lib/types";

interface KitchenSession {
  kitchenId?: string;
}

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "chefychef-kitchen",
    maxAge: 60 * 60 * 24 * 365,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

async function getKitchenId(): Promise<string> {
  const session = await useSession<KitchenSession>(sessionConfig());
  const existing = session.data.kitchenId;
  if (existing) return existing;
  const kitchenId = crypto.randomUUID();
  await session.update({ kitchenId });
  return kitchenId;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const GROCERY_COLUMNS =
  "id, name, category, quantity, unit, purchase_date, expiry_date, used, notes, created_at";

function str(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid ${field}`);
  return value.trim();
}

export const listGroceriesFn = createServerFn({ method: "GET" }).handler(async () => {
  const kitchenId = await getKitchenId();
  const { data, error } = await (await admin())
    .from("groceries")
    .select(GROCERY_COLUMNS)
    .eq("owner_key", kitchenId);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Grocery[];
});

export const insertGroceryFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    return {
      name: str(raw["name"], "name"),
      category: str(raw["category"], "category"),
      quantity: typeof raw["quantity"] === "number" ? raw["quantity"] : 1,
      unit: typeof raw["unit"] === "string" && raw["unit"].trim() ? raw["unit"].trim() : "pcs",
      purchase_date: str(raw["purchase_date"], "purchase_date"),
      expiry_date: str(raw["expiry_date"], "expiry_date"),
      notes: typeof raw["notes"] === "string" && raw["notes"].trim() ? raw["notes"].trim() : null,
    };
  })
  .handler(async ({ data }) => {
    const kitchenId = await getKitchenId();
    const { data: row, error } = await (await admin())
      .from("groceries")
      .insert({ ...data, used: false, owner_key: kitchenId })
      .select(GROCERY_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as Grocery;
  });

export const updateGroceryFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof raw["used"] === "boolean") patch["used"] = raw["used"];
    if (typeof raw["name"] === "string") patch["name"] = raw["name"].trim();
    if (typeof raw["category"] === "string") patch["category"] = raw["category"];
    if (typeof raw["quantity"] === "number") patch["quantity"] = raw["quantity"];
    if (typeof raw["unit"] === "string") patch["unit"] = raw["unit"];
    if (typeof raw["purchase_date"] === "string") patch["purchase_date"] = raw["purchase_date"];
    if (typeof raw["expiry_date"] === "string") patch["expiry_date"] = raw["expiry_date"];
    if (typeof raw["notes"] === "string" || raw["notes"] === null) patch["notes"] = raw["notes"];
    return { id: str(raw["id"], "id"), patch };
  })
  .handler(async ({ data }) => {
    const kitchenId = await getKitchenId();
    const { data: row, error } = await (await admin())
      .from("groceries")
      .update(data.patch)
      .eq("id", data.id)
      .eq("owner_key", kitchenId)
      .select(GROCERY_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as Grocery;
  });

export const deleteGroceryFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ({
    id: str(((input ?? {}) as Record<string, unknown>)["id"], "id"),
  }))
  .handler(async ({ data }) => {
    const kitchenId = await getKitchenId();
    const { error } = await (await admin())
      .from("groceries")
      .delete()
      .eq("id", data.id)
      .eq("owner_key", kitchenId);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });
