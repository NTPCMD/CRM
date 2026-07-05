import { listInvoices, listClients } from "@/lib/queries";
import { Card, CardBody, PageHeader, Table, Pill, Empty } from "@/components/ui";
import { statusPillTone } from "@/lib/health";
import { NewInvoiceButton } from "@/components/forms/new-invoice";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const [invoices, clients] = await Promise.all([listInvoices(), listClients()]);
  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} ${invoices.length === 1 ? "invoice" : "invoices"}`}
        actions={<NewInvoiceButton clients={clients.map((c) => ({ id: c.id, name: c.name }))} />}
      />
      <Card>
        <CardBody className="p-0 py-1.5">
          {invoices.length ? (
            <Table head={["Invoice", "Status", "Currency", "Due"]}>
              {invoices.map((i) => (
                <tr key={i.id} className="hover:bg-card2">
                  <td className="px-3.5 py-3 border-t border-border font-mono">{i.number ?? "—"}</td>
                  <td className="px-3.5 py-3 border-t border-border"><Pill tone={statusPillTone(i.status)}>{i.status}</Pill></td>
                  <td className="px-3.5 py-3 border-t border-border text-muted">{i.currency}</td>
                  <td className="px-3.5 py-3 border-t border-border text-muted">{i.due_date ?? "—"}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty title="No invoices yet" hint="Create an invoice to bill a client. Totals are always calculated from line items." />
          )}
        </CardBody>
      </Card>
    </>
  );
}
