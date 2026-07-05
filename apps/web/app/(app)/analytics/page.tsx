import { listClients, listProjects, listInvoices } from "@/lib/queries";
import { PageHeader, Card, CardHeader, CardBody, Kpi, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [clients, projects, invoices] = await Promise.all([listClients(), listProjects(), listInvoices()]);

  const byStatus = invoices.reduce<Record<string, number>>((m, i) => {
    m[i.status] = (m[i.status] ?? 0) + 1;
    return m;
  }, {});
  const projectsByClient = clients
    .map((c) => ({ name: c.name, count: projects.filter((p) => p.client_id === c.id).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxCount = Math.max(1, ...projectsByClient.map((x) => x.count));

  return (
    <>
      <PageHeader title="Analytics" subtitle="Operational performance across your workspace." />
      <div className="grid gap-3.5 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        <Kpi label="Clients" value={clients.length} />
        <Kpi label="Active projects" value={projects.filter((p) => p.status === "active").length} />
        <Kpi label="Total projects" value={projects.length} />
        <Kpi label="Invoices" value={invoices.length} />
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <CardHeader title="Projects by client" />
          <CardBody>
            {projectsByClient.length ? (
              projectsByClient.map((x) => (
                <div key={x.name} className="my-2.5">
                  <div className="flex justify-between text-[12px] mb-1.5"><span>{x.name}</span><span className="num text-muted">{x.count}</span></div>
                  <div className="h-2 rounded-full bg-card2 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(x.count / maxCount) * 100}%` }} /></div>
                </div>
              ))
            ) : (
              <Empty title="No data yet" hint="Create projects to see this chart." />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Invoices by status" />
          <CardBody>
            {Object.keys(byStatus).length ? (
              Object.entries(byStatus).map(([st, n]) => (
                <div key={st} className="flex items-center justify-between py-2 border-t border-border first:border-0">
                  <span className="capitalize text-[13px]">{st}</span>
                  <span className="num font-semibold">{n}</span>
                </div>
              ))
            ) : (
              <Empty title="No invoices yet" hint="Create invoices to see the breakdown." />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
