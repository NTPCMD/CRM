import { listCalendarEvents } from "@/lib/more-queries";
import { PageHeader, Card, CardBody, Pill, Empty } from "@/components/ui";
import { NewEventButton } from "@/components/forms/new-event";

export const dynamic = "force-dynamic";

const TYPE_TONE: Record<string, "blue" | "amber" | "green" | "violet" | "grey"> = {
  meeting: "blue", deadline: "amber", review: "violet", event: "green", availability: "grey",
};

export default async function CalendarPage() {
  const events = await listCalendarEvents();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= Date.now() - 86400000);

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle={`${upcoming.length} upcoming`}
        actions={<NewEventButton />}
      />
      <Card>
        <CardBody className="p-0">
          {upcoming.length ? (
            upcoming.map((e) => {
              const d = new Date(e.starts_at);
              return (
                <div key={e.id} className="flex items-center gap-4 px-3.5 py-3 border-t border-border first:border-0 hover:bg-card2">
                  <div className="text-center w-12 flex-none">
                    <div className="text-[11px] uppercase text-faint">{d.toLocaleDateString("en-US", { month: "short" })}</div>
                    <div className="text-[20px] font-bold leading-none num">{d.getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">{e.title}</div>
                    <div className="text-[11.5px] text-faint">
                      {e.all_day ? "All day" : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                  </div>
                  <Pill tone={TYPE_TONE[e.type] ?? "grey"}>{e.type}</Pill>
                </div>
              );
            })
          ) : (
            <Empty title="Nothing scheduled" hint="Meetings, deadlines, and reviews will show up here." />
          )}
        </CardBody>
      </Card>
    </>
  );
}
