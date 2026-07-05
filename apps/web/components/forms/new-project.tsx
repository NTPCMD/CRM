"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import { Field, Input, Select, FormError } from "@/components/form-controls";
import { Icon } from "@/components/icon";
import { createProjectAction } from "@/app/(app)/projects/actions";

export function NewProjectButton({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal label={<><Icon name="Plus" className="w-4 h-4" /> New project</>} title="New project">
      {(close) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await createProjectAction(fd);
              if (res?.error) setErr(res.error);
              else {
                close();
                router.refresh();
              }
            });
          }}
        >
          <FormError>{err}</FormError>
          <Field label="Project name"><Input name="name" required autoFocus placeholder="Website Redesign" /></Field>
          <Field label="Client">
            <Select name="client_id" defaultValue="">
              <option value="">— No client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date"><Input name="due_date" type="date" /></Field>
            <Field label="Budget"><Input name="budget" type="number" min="0" step="100" placeholder="48000" /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending}>{pending ? "Creating…" : "Create project"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
