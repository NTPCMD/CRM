import { PageHeader, Card, CardBody, Pill, Button } from "@/components/ui";

export const dynamic = "force-dynamic";

const INTEGRATIONS = [
  { n: "Stripe", cat: "Payments", on: false, c: "#635bff", i: "S", d: "Collect invoice payments and reconcile automatically." },
  { n: "Google Workspace", cat: "Productivity", on: false, c: "#ea4335", i: "G", d: "Calendar sync, Drive files, and SSO." },
  { n: "Slack", cat: "Messaging", on: false, c: "#4a154b", i: "#", d: "Push notifications to channels." },
  { n: "GitHub", cat: "Development", on: false, c: "#24292e", i: "GH", d: "Link commits and PRs to tasks." },
  { n: "QuickBooks", cat: "Finance", on: false, c: "#2ca01c", i: "Q", d: "Sync invoices and payments to accounting." },
  { n: "Figma", cat: "Design", on: false, c: "#f24e1e", i: "F", d: "Embed live design files in projects." },
  { n: "Zapier", cat: "Automation", on: false, c: "#ff4a00", i: "Z", d: "Connect AgencyOS to 6,000+ apps." },
  { n: "Google Calendar", cat: "Calendar", on: false, c: "#4285f4", i: "C", d: "Two-way sync of meetings and deadlines." },
];

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader title="Integrations" subtitle={`${INTEGRATIONS.length} available · connect providers in Volume 4`} />
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
        {INTEGRATIONS.map((g) => (
          <Card key={g.n}>
            <CardBody className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] grid place-items-center text-white font-extrabold text-sm" style={{ background: g.c }}>{g.i}</div>
                <div>
                  <div className="font-semibold">{g.n}</div>
                  <div className="text-[11.5px] text-faint">{g.cat}</div>
                </div>
                <div className="ml-auto">{g.on && <Pill tone="green">Connected</Pill>}</div>
              </div>
              <div className="text-[12px] text-muted min-h-[34px]">{g.d}</div>
              <Button variant={g.on ? "default" : "primary"} className="w-full justify-center">{g.on ? "Manage" : "Connect"}</Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
