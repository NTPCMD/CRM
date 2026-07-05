import { listContracts } from "@/lib/more-queries";
import { PageHeader, Card, CardBody, Table, Pill, Empty, Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import { statusPillTone } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const contracts = await listContracts();
  return (
    <>
      <PageHeader
        title="Contracts"
        subtitle={`${contracts.length} ${contracts.length === 1 ? "document" : "documents"}`}
        actions={<Button variant="primary"><Icon name="Plus" className="w-4 h-4" /> New contract</Button>}
      />
      <Card>
        <CardBody className="p-0 py-1.5">
          {contracts.length ? (
            <Table head={["Document", "Client", "Status", "Version"]}>
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-card2">
                  <td className="px-3.5 py-3 border-t border-border">
                    <div className="flex items-center gap-2.5">
                      <Icon name="FileText" className="w-4 h-4 text-muted" />
                      <b>{c.title}</b>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-t border-border text-muted">{c.clients?.name ?? "—"}</td>
                  <td className="px-3.5 py-3 border-t border-border"><Pill tone={statusPillTone(c.status)}>{c.status}</Pill></td>
                  <td className="px-3.5 py-3 border-t border-border text-muted num">v{c.current_version}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty title="No contracts yet" hint="Draft a contract to send for signature." />
          )}
        </CardBody>
      </Card>
    </>
  );
}
