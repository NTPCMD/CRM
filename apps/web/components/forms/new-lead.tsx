"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import { Field, Input, Select, FormError } from "@/components/form-controls";
import { Icon } from "@/components/icon";
import { createLeadAction } from "@/app/(app)/pipeline/actions";

export function NewLeadButton() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal label={<><Icon name="Plus" className="w-4 h-4" /> New lead</>} title="New lead">
      {(close) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await createLeadAction(fd);
              if (res?.error) setErr(res.error);
              else {
                close();
                router.refresh();
              }
            });
          }}
        >
          <FormError>{err}</FormError>
          <Field label="Name"><Input name="name" required autoFocus placeholder="Jane Doe" /></Field>
          <Field label="Company"><Input name="company" placeholder="Vandelay Industries" /></Field>
          <Field label="Email"><Input name="email" type="email" placeholder="jane@vandelay.com" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <Select name="stage" defaultValue="lead">
                <option value="lead">Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </Select>
            </Field>
            <Field label="Est. value"><Input name="value" type="number" min="0" step="1000" placeholder="25000" /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending}>{pending ? "Adding…" : "Add lead"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
