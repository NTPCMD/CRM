"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import { Field, Input, Select, Textarea, FormError } from "@/components/form-controls";
import { Icon } from "@/components/icon";
import { createCalendarEventAction } from "@/app/(app)/calendar/actions";

export function NewEventButton() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal label={<><Icon name="Plus" className="w-4 h-4" /> New event</>} title="New calendar event">
      {(close) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await createCalendarEventAction(fd);
              if (res?.error) setErr(res.error);
              else { close(); router.refresh(); }
            });
          }}
        >
          <FormError>{err}</FormError>
          <Field label="Title"><Input name="title" required autoFocus placeholder="Design review" /></Field>
          <Field label="Type">
            <Select name="type" defaultValue="meeting">
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="review">Review</option>
              <option value="event">Event</option>
              <option value="availability">Availability</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><Input name="starts_at" type="datetime-local" required /></Field>
            <Field label="End"><Input name="ends_at" type="datetime-local" /></Field>
          </div>
          <Field label="Location"><Input name="location" placeholder="Google Meet / 123 Main St" /></Field>
          <Field label="Notes"><Textarea name="description" placeholder="Agenda or details…" /></Field>
          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending}>{pending ? "Creating…" : "Create event"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
