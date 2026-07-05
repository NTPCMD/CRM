"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import { Field, Input, Select, Textarea, FormError } from "@/components/form-controls";
import { Icon } from "@/components/icon";
import { createClientAction } from "@/app/(app)/clients/actions";

export function NewClientButton() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal label={<><Icon name="Plus" className="w-4 h-4" /> New client</>} title="New client">
      {(close) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await createClientAction(fd);
              if (res?.error) setErr(res.error);
              else {
                close();
                router.refresh();
              }
            });
          }}
        >
          <FormError>{err}</FormError>
          <Field label="Client name"><Input name="name" required autoFocus placeholder="Globex" /></Field>
          <Field label="Type">
            <Select name="type" defaultValue="company">
              <option value="company">Company</option>
              <option value="individual">Individual</option>
            </Select>
          </Field>
          <Field label="Website"><Input name="website" placeholder="globex.com" /></Field>
          <Field label="Notes"><Textarea name="notes" placeholder="Anything worth remembering…" /></Field>
          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending}>{pending ? "Creating…" : "Create client"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
