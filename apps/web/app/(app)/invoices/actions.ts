"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { createClient as db } from "@/lib/supabase/server";

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export async function createInvoiceAction(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getContext();
  if (!ctx?.workspace) return { error: "No active workspace." };

  let items: LineItem[] = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    items = [];
  }
  items = items.filter((i) => i.description?.trim());
  if (items.length === 0) return { error: "Add at least one line item." };

  const s = await db();
  const { data: number } = await s.rpc("generate_invoice_number", { p_ws: ctx.workspace.id });

  const { data: invoice, error } = await s
    .from("invoices")
    .insert({
      workspace_id: ctx.workspace.id,
      client_id: str(formData.get("client_id")),
      number: number ?? null,
      status: "draft",
      currency: str(formData.get("currency")) ?? "USD",
      due_date: str(formData.get("due_date")),
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: itemErr } = await s.from("invoice_items").insert(
    items.map((it, idx) => ({
      workspace_id: ctx.workspace!.id,
      invoice_id: invoice!.id,
      description: it.description.trim(),
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 0,
      position: idx,
    })),
  );
  if (itemErr) return { error: itemErr.message };

  revalidatePath("/invoices");
  return {};
}
