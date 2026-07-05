"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Field, Input, FormError } from "@/components/form-controls";
import { updateWorkspaceAction } from "@/app/(app)/settings/actions";

export function WorkspaceSettingsForm({
  workspace,
}: {
  workspace: { name: string; timezone: string; country: string | null };
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        setOk(false);
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await updateWorkspaceAction(fd);
          if (res?.error) setErr(res.error);
          else {
            setOk(true);
            router.refresh();
          }
        });
      }}
    >
      <FormError>{err}</FormError>
      <Field label="Workspace name"><Input name="name" defaultValue={workspace.name} required /></Field>
      <Field label="Timezone"><Input name="timezone" defaultValue={workspace.timezone} placeholder="America/Los_Angeles" /></Field>
      <Field label="Country"><Input name="country" defaultValue={workspace.country ?? ""} placeholder="United States" /></Field>
      <div className="flex items-center gap-3 mt-1">
        <Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        {ok && <span className="text-[12px] text-success">Saved</span>}
      </div>
    </form>
  );
}
