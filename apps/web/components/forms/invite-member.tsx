"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import { Field, Input, Select, FormError } from "@/components/form-controls";
import { Icon } from "@/components/icon";
import { inviteMemberAction } from "@/app/(app)/team/actions";

export function InviteMemberButton({ roles }: { roles: { id: string; name: string }[] }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal label={<><Icon name="Plus" className="w-4 h-4" /> Invite member</>} title="Invite a team member">
      {(close) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await inviteMemberAction(fd);
              if (res?.error) setErr(res.error);
              else { close(); router.refresh(); }
            });
          }}
        >
          <FormError>{err}</FormError>
          <Field label="Email address">
            <Input name="email" type="email" required autoFocus placeholder="teammate@example.com" />
          </Field>
          <Field label="Role">
            <Select name="role_id" required defaultValue="">
              <option value="" disabled>Select a role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending}>{pending ? "Inviting…" : "Send invite"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
