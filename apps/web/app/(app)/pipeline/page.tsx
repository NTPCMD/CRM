import { listLeads } from "@/lib/more-queries";
import { PageHeader, Card, CardBody, Empty } from "@/components/ui";
import { NewLeadButton } from "@/components/forms/new-lead";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STAGES = [
  { key: "lead", label: "Lead", color: "#9ca3af" },
  { key: "qualified", label: "Qualified", color: "#3b82f6" },
  { key: "proposal", label: "Proposal", color: "#8b5cf6" },
  { key: "negotiation", label: "Negotiation", color: "#f59e0b" },
  { key: "won", label: "Won", color: "#22c55e" },
  { key: "lost", label: "Lost", color: "#ef4444" },
];

export default async function PipelinePage() {
  const leads = await listLeads();
  const total = leads.filter((l) => l.stage !== "lost").reduce((s, l) => s + (l.value ?? 0), 0);
  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle={`${leads.length} deals · ${money(total)} in play`}
        actions={<NewLeadButton />}
      />
      {leads.length ? (
        <div className="grid gap-3.5 overflow-x-auto" style={{ gridAutoFlow: "column", gridAutoColumns: "minmax(230px,1fr)" }}>
          {STAGES.map((st) => {
            const items = leads.filter((l) => l.stage === st.key);
            return (
              <div key={st.key} className="bg-surface border border-border rounded min-w-[230px]">
                <div className="flex items-center gap-2 px-3.5 py-3 text-[12.5px] font-semibold">
                  <span className="w-2 h-2 rounded-[3px]" style={{ background: st.color }} />
                  {st.label}
                  <span className="ml-auto text-faint text-[11px]">{items.length}</span>
                </div>
                <div className="px-2.5 pb-2.5 flex flex-col gap-2.5 min-h-[40px]">
                  {items.map((l) => (
                    <div key={l.id} className="bg-card border border-border rounded-[10px] p-3 shadow-card">
                      <div className="text-[13px] font-semibold leading-snug">{l.name}</div>
                      {l.company && <div className="text-[11.5px] text-faint">{l.company}</div>}
                      <div className="text-[13px] num font-bold mt-2">{money(l.value ?? 0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card><CardBody><Empty title="No leads yet" hint="Add a lead to start building your pipeline." /></CardBody></Card>
      )}
    </>
  );
}
