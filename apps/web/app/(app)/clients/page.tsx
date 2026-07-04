import Link from "next/link";
import { listClients } from "@/lib/queries";
import { Card, CardBody, PageHeader, Table, Pill, Avatar, Empty, Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import { statusPillTone } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await listClients();
  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} ${clients.length === 1 ? "client" : "clients"}`}
        actions={<Button variant="primary"><Icon name="Plus" className="w-4 h-4" /> New client</Button>}
      />
      <Card>
        <CardBody className="p-0 py-1.5">
          {clients.length ? (
            <Table head={["Client", "Type", "Status", "Added"]}>
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-card2">
                  <td className="px-3.5 py-3 border-t border-border">
                    <Link href={`/clients/${c.id}`} className="flex items-center gap-2.5">
                      <Avatar name={c.name} size={30} />
                      <b>{c.name}</b>
                    </Link>
                  </td>
                  <td className="px-3.5 py-3 border-t border-border text-muted capitalize">{c.type}</td>
                  <td className="px-3.5 py-3 border-t border-border">
                    <Pill tone={statusPillTone(c.status)}>{c.status}</Pill>
                  </td>
                  <td className="px-3.5 py-3 border-t border-border text-muted">
                    {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty title="No clients yet" hint="Add your first client to start tracking projects, invoices, and messages." />
          )}
        </CardBody>
      </Card>
    </>
  );
}
