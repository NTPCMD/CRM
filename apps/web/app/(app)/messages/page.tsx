import Link from "next/link";
import { getContext } from "@/lib/session";
import { listConversations, listMessages } from "@/lib/messages";
import { PageHeader, Pill, Card, CardBody, Empty } from "@/components/ui";
import { MessageComposer } from "@/components/message-composer";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const [ctx, conversations] = await Promise.all([getContext(), listConversations()]);

  if (conversations.length === 0) {
    return (
      <>
        <PageHeader title="Messages" subtitle="Conversations with your team and clients." />
        <Card><CardBody><Empty title="No conversations yet" hint="Project conversations appear here. Internal threads are never shown to clients." /></CardBody></Card>
      </>
    );
  }

  const active = conversations.find((x) => x.id === c) ?? conversations[0];
  const messages = await listMessages(active.id);
  const title = (cv: { title: string | null; scope: string }) => cv.title ?? (cv.scope === "internal" ? "Internal thread" : "Client conversation");

  return (
    <>
      <PageHeader title="Messages" subtitle={`${conversations.length} conversations`} />
      <div className="grid rounded border border-border overflow-hidden bg-card" style={{ gridTemplateColumns: "290px 1fr", height: "calc(100vh - 200px)", minHeight: 420 }}>
        <div className="border-r border-border overflow-y-auto">
          {conversations.map((cv) => (
            <Link key={cv.id} href={`/messages?c=${cv.id}`}
              className={cn("flex items-center gap-2.5 px-3.5 py-3 border-b border-border cursor-pointer hover:bg-card2", cv.id === active.id && "bg-primarySoft")}>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold flex items-center gap-1.5">{title(cv)}</div>
                <div className="text-[11.5px] text-faint">{cv.scope === "internal" ? "Internal" : "Client"}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-border font-semibold text-[14px] flex items-center gap-2.5">
            {title(active)}
            {active.scope === "internal" && <Pill tone="grey">internal</Pill>}
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length ? (
              messages.map((m) => {
                const me = m.author_id === ctx?.userId;
                const author = [m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ") || "Unknown";
                return (
                  <div key={m.id} className={cn("flex gap-2.5 max-w-[78%]", me && "self-end flex-row-reverse")}>
                    <div>
                      {!me && <div className="text-[11px] text-faint mb-1">{author}{m.is_internal ? " · internal" : ""}</div>}
                      <div className={cn("px-3 py-2.5 rounded-[12px] text-[13px]", me ? "bg-primary text-white" : "bg-card2", m.is_internal && !me && "border border-dashed border-warning")}>
                        {m.body}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-faint text-[13px] m-auto">No messages yet — say hello.</div>
            )}
          </div>
          <MessageComposer conversationId={active.id} />
        </div>
      </div>
    </>
  );
}
