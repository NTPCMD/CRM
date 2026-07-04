import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient, listProjects, listInvoices } from "@/lib/queries";
import { Card, CardHeader, CardBody, Pill, Avatar, Table, Empty, Button, Progress } from "@/components/ui";
import { Icon } from "@/components/icon";
import { statusPillTone, healthPill } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const [projects, invoices] = await Promise.all([listProjects(id), listInvoices(id)]);

  return (
    <>
      <Link href="/clients" className="text-xs text-muted inline-flex gap-1.5 items-center mb-3.5 hover:text-text">
        <Icon name="ArrowLeft" className="w-3.5 h-3.5" /> All clients
      </Link>
      <div className="flex items-center gap-3.5 mb-5 flex-wrap">
        <Avatar name={client.name} size={50} />
        <div>
          <h1 className="text-[22px] m-0 tracking-tight">{client.name}</h1>
          <div className="text-muted text-[13px] mt-0.5 flex gap-3 flex-wrap items-center">
            <Pill tone={statusPillTone(client.status)}>{client.status}</Pill>
            <span className="capitalize">{client.type}</span>
            {client.website && <span>{client.website}</span>}
          </div>
        </div>
        <div className="flex-1" />
        <Button><Icon name="MessageSquare" className="w-4 h-4" /> Message</Button>
        <Button variant="primary"><Icon name="Plus" className="w-4 h-4" /> New project</Button>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <div className="grid gap-4 content-start">
          <Card>
            <CardHeader title="Projects" />
            <CardBody className="pt-1.5">
              {projects.length ? (
                <Table head={["Project", "Health", "Progress", "Due"]}>
                  {projects.map((p) => {
                    const h = healthPill(p.health_score);
                    return (
                      <tr key={p.id} className="hover:bg-card2">
                        <td className="px-3.5 py-3 border-t border-border">
                          <Link href={`/projects/${p.id}`} className="font-semibold hover:text-primary">{p.name}</Link>
                        </td>
                        <td className="px-3.5 py-3 border-t border-border"><Pill tone={h.tone}>{h.label}</Pill></td>
                        <td className="px-3.5 py-3 border-t border-border w-[160px]"><Progress value={Math.max(0, Math.min(100, p.health_score ?? 0))} /></td>
                        <td className="px-3.5 py-3 border-t border-border text-muted">{p.due_date ?? "—"}</td>
                      </tr>
                    );
                  })}
                </Table>
              ) : (
                <Empty title="No projects" hint="This client doesn't have any projects yet." />
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Invoices" />
            <CardBody className="pt-1.5">
              {invoices.length ? (
                <Table head={["Invoice", "Status", "Due"]}>
                  {invoices.map((i) => (
                    <tr key={i.id} className="hover:bg-card2">
                      <td className="px-3.5 py-3 border-t border-border font-mono">{i.number ?? "—"}</td>
                      <td className="px-3.5 py-3 border-t border-border"><Pill tone={statusPillTone(i.status)}>{i.status}</Pill></td>
                      <td className="px-3.5 py-3 border-t border-border text-muted">{i.due_date ?? "—"}</td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty title="No invoices" hint="Invoices for this client will appear here." />
              )}
            </CardBody>
          </Card>
        </div>
        <div className="grid gap-4 content-start">
          <Card>
            <CardHeader title="About" />
            <CardBody>
              <dl className="grid gap-3 m-0">
                <div><dt className="text-xs text-muted">Type</dt><dd className="m-0 capitalize">{client.type}</dd></div>
                <div><dt className="text-xs text-muted">Status</dt><dd className="m-0 capitalize">{client.status}</dd></div>
                {client.website && <div><dt className="text-xs text-muted">Website</dt><dd className="m-0">{client.website}</dd></div>}
                {client.notes && <div><dt className="text-xs text-muted">Notes</dt><dd className="m-0 text-[13px]">{client.notes}</dd></div>}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
