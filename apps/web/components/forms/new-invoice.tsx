"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import { Field, Input, Select, FormError } from "@/components/form-controls";
import { Icon } from "@/components/icon";
import { money } from "@/lib/utils";
import { createInvoiceAction } from "@/app/(app)/invoices/actions";

interface Row {
  description: string;
  quantity: number;
  unit_price: number;
}

export function NewInvoiceButton({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<Row[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  const subtotal = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unit_price) || 0), 0),
    [rows],
  );

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <Modal label={<><Icon name="Plus" className="w-4 h-4" /> New invoice</>} title="New invoice" size="md">
      {(close) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            const fd = new FormData(e.currentTarget);
            fd.set("items", JSON.stringify(rows.filter((r) => r.description.trim())));
            start(async () => {
              const res = await createInvoiceAction(fd);
              if (res?.error) setErr(res.error);
              else {
                close();
                router.refresh();
              }
            });
          }}
        >
          <FormError>{err}</FormError>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Client">
              <Select name="client_id" defaultValue="">
                <option value="">— No client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Currency">
              <Select name="currency" defaultValue="USD">
                <option>USD</option><option>EUR</option><option>GBP</option><option>AUD</option>
              </Select>
            </Field>
            <Field label="Due date"><Input name="due_date" type="date" /></Field>
          </div>

          <div className="mb-1 text-[12px] text-muted font-semibold">Line items</div>
          <div className="border border-border rounded-lg overflow-hidden mb-3">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border-b border-border last:border-0">
                <input
                  placeholder="Description"
                  value={r.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  className="flex-1 bg-bg border border-border rounded-md px-2.5 py-2 text-[13px] outline-none focus:border-primary"
                />
                <input
                  type="number" min="0" step="1" value={r.quantity}
                  onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                  className="w-16 bg-bg border border-border rounded-md px-2 py-2 text-[13px] text-right outline-none focus:border-primary"
                  aria-label="Quantity"
                />
                <input
                  type="number" min="0" step="0.01" value={r.unit_price}
                  onChange={(e) => update(i, { unit_price: Number(e.target.value) })}
                  className="w-24 bg-bg border border-border rounded-md px-2 py-2 text-[13px] text-right outline-none focus:border-primary"
                  aria-label="Unit price"
                />
                <div className="w-24 text-right text-[13px] num">{money(r.quantity * r.unit_price)}</div>
                <button
                  type="button" aria-label="Remove line"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs))}
                  className="w-7 h-7 grid place-items-center rounded-md text-muted hover:bg-card hover:text-danger"
                >✕</button>
              </div>
            ))}
          </div>

          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={() => setRows((rs) => [...rs, { description: "", quantity: 1, unit_price: 0 }])}
              className="text-[12px] text-primary font-semibold"
            >
              + Add line
            </button>
            <div className="ml-auto text-[13px]">
              <span className="text-muted mr-3">Subtotal</span>
              <span className="num font-bold text-[15px]">{money(subtotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending}>{pending ? "Creating…" : "Create draft"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
