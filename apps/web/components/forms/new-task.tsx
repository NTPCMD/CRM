"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import { Field, Input, Select, FormError } from "@/components/form-controls";
import { Icon } from "@/components/icon";
import { createTaskAction } from "@/app/(app)/projects/actions";

export function NewTaskButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal label={<><Icon name="Plus" className="w-4 h-4" /> New task</>} title="New task">
      {(close) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            const fd = new FormData(e.currentTarget);
            fd.set("project_id", projectId);
            start(async () => {
              const res = await createTaskAction(fd);
              if (res?.error) setErr(res.error);
              else {
                close();
                router.refresh();
              }
            });
          }}
        >
          <FormError>{err}</FormError>
          <Field label="Title"><Input name="title" required autoFocus placeholder="Wireframe the pricing page" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select name="status" defaultValue="todo">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </Select>
            </Field>
            <Field label="Priority">
              <Select name="priority" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending}>{pending ? "Adding…" : "Add task"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
