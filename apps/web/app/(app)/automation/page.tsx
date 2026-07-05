import { PageHeader, Card, CardBody, Button } from "@/components/ui";
import { Icon } from "@/components/icon";

export const dynamic = "force-dynamic";

const AUTOMATIONS = [
  { n: "Invoice paid → thank client", trigger: "invoice.paid", cond: "Amount > $5,000", actions: ["Notify CEO", "Draft thank-you email", "Update dashboard"], on: true },
  { n: "Project completed → wrap-up", trigger: "project.completed", cond: "Always", actions: ["Generate final invoice", "Archive project", "Request testimonial"], on: true },
  { n: "Task overdue → nudge", trigger: "task.overdue", cond: "Priority is High", actions: ["Notify assignee", "Flag on dashboard"], on: false },
  { n: "New lead → assign owner", trigger: "lead.created", cond: "Source is Website", actions: ["Assign to owner", "Create follow-up task"], on: true },
];

export default function AutomationPage() {
  return (
    <>
      <PageHeader
        title="Automation"
        subtitle="Event → condition → action workflows. The engine runs in Volume 4."
        actions={<Button variant="primary"><Icon name="Plus" className="w-4 h-4" /> New automation</Button>}
      />
      <div className="flex flex-col gap-4">
        {AUTOMATIONS.map((a) => (
          <Card key={a.n}>
            <CardBody className="flex items-center gap-4 flex-wrap">
              <div className="min-w-[200px]">
                <div className="font-semibold">{a.n}</div>
                <div className="text-[12px] text-muted">Trigger · {a.trigger}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap flex-1 text-[12px]">
                <span className="px-2.5 py-1 rounded-lg font-semibold bg-primarySoft text-primary">When {a.trigger}</span>
                <span className="text-faint">→</span>
                <span className="px-2.5 py-1 rounded-lg font-semibold bg-[var(--warning-soft)] text-warning">If {a.cond}</span>
                <span className="text-faint">→</span>
                {a.actions.map((x, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg font-semibold bg-[var(--success-soft)] text-success">{x}</span>
                ))}
              </div>
              <span className={`w-[38px] h-[22px] rounded-full border relative ${a.on ? "bg-primarySoft border-primary" : "bg-card2 border-border"}`}>
                <span className={`absolute top-[2px] w-4 h-4 rounded-full ${a.on ? "left-[18px] bg-primary" : "left-[2px] bg-faint"}`} />
              </span>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
