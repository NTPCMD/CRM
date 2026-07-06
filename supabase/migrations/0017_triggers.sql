-- 0017_triggers.sql
-- Event-driven triggers: activity log on writes + notifications on task assignment.
-- These run as SECURITY DEFINER so they can write to the log regardless of the
-- row-level security policy on the target table.

-- ─── helpers ───────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION app.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  _action  text;
  _obj_id  text;
  _obj_nm  text;
  _name    text;
  _actor   uuid;
BEGIN
  IF    TG_OP = 'INSERT' THEN _action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN _action := 'updated';
  ELSIF TG_OP = 'DELETE' THEN _action := 'deleted';
  END IF;

  -- Each table provides its own "name" column or falls back to id.
  IF TG_TABLE_NAME IN ('clients','projects','invoices','contracts','tasks','leads') THEN
    IF TG_OP = 'DELETE' THEN
      _obj_id := OLD.id::text;
      BEGIN _name := OLD.name; EXCEPTION WHEN OTHERS THEN _name := OLD.id::text; END;
    ELSE
      _obj_id := NEW.id::text;
      BEGIN _name := NEW.name; EXCEPTION WHEN OTHERS THEN _name := NEW.id::text; END;
    END IF;
  ELSIF TG_TABLE_NAME = 'messages' THEN
    IF TG_OP = 'DELETE' THEN _obj_id := OLD.id::text; _name := 'message';
    ELSE _obj_id := NEW.id::text; _name := 'message'; END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN _obj_id := OLD.id::text; ELSE _obj_id := NEW.id::text; END IF;
    _name := TG_TABLE_NAME;
  END IF;

  IF TG_OP = 'DELETE' THEN
    _actor := COALESCE(OLD.updated_by, OLD.created_by);
    INSERT INTO activity_logs (workspace_id, actor_id, action, object_type, object_id,
                               object_name, metadata)
    VALUES (OLD.workspace_id, _actor, _action, TG_TABLE_NAME, _obj_id, _name, '{}');
  ELSE
    _actor := COALESCE(NEW.updated_by, NEW.created_by);
    INSERT INTO activity_logs (workspace_id, actor_id, action, object_type, object_id,
                               object_name, metadata)
    VALUES (NEW.workspace_id, _actor, _action, TG_TABLE_NAME, _obj_id, _name, '{}');
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- ─── attach activity logger ────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','projects','tasks','invoices','contracts','leads','messages'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_activity_log ON %I;
       CREATE TRIGGER trg_activity_log
       AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION app.log_activity()',
      t, t
    );
  END LOOP;
END;
$$;

-- ─── notification on task assignment ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION app.notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  -- Only fire when assignee changes and there is a new assignee.
  IF (NEW.assignee_id IS NULL) THEN RETURN NEW; END IF;
  IF (TG_OP = 'UPDATE' AND OLD.assignee_id IS NOT DISTINCT FROM NEW.assignee_id) THEN
    RETURN NEW;
  END IF;
  -- Don't notify if someone assigns to themselves.
  IF NEW.assignee_id = NEW.updated_by THEN RETURN NEW; END IF;

  INSERT INTO notifications (workspace_id, profile_id, type, title, body, object_type, object_id)
  VALUES (
    NEW.workspace_id,
    NEW.assignee_id,
    'task_assigned',
    'You''ve been assigned a task',
    COALESCE(NEW.title, 'A task'),
    'tasks',
    NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_assigned ON tasks;
CREATE TRIGGER trg_task_assigned
AFTER INSERT OR UPDATE OF assignee_id ON tasks
FOR EACH ROW EXECUTE FUNCTION app.notify_task_assigned();

-- ─── notification on invoice sent ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION app.notify_invoice_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  -- Fire when an invoice transitions to 'sent'.
  IF (NEW.status = 'sent' AND (OLD.status IS DISTINCT FROM 'sent')) THEN
    -- Notify all workspace admins (grants_all).
    INSERT INTO notifications (workspace_id, profile_id, type, title, body, object_type, object_id)
    SELECT
      NEW.workspace_id,
      wm.profile_id,
      'invoice_sent',
      'Invoice sent',
      COALESCE(NEW.number, 'Invoice'),
      'invoices',
      NEW.id::text
    FROM workspace_members wm
    JOIN roles r ON r.id = wm.role_id AND r.grants_all = true
    WHERE wm.workspace_id = NEW.workspace_id
      AND wm.status = 'active'
      AND wm.deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_status ON invoices;
CREATE TRIGGER trg_invoice_status
AFTER UPDATE OF status ON invoices
FOR EACH ROW EXECUTE FUNCTION app.notify_invoice_status();

-- ─── mark messages read on delivery ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION app.mark_message_read()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  -- Auto-read for the author — they wrote it, they've read it.
  INSERT INTO message_reads (workspace_id, message_id, profile_id, read_at)
  VALUES (NEW.workspace_id, NEW.id, NEW.author_id, NOW())
  ON CONFLICT (message_id, profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_read ON messages;
CREATE TRIGGER trg_message_read
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION app.mark_message_read();
