import { redirect } from "next/navigation";
import { getContext } from "@/lib/session";
import { visibleNav } from "@/lib/nav";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { colorFor, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { ceo: "CEO", worker: "Worker", client: "Client" };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  if (!ctx.workspace) redirect("/onboarding");

  const items = visibleNav(ctx.permissions);
  const name =
    [ctx.profile?.first_name, ctx.profile?.last_name].filter(Boolean).join(" ") ||
    ctx.profile?.email ||
    "You";
  const user = {
    name,
    role: ROLE_LABEL[ctx.roleKey ?? ""] ?? "Member",
    color: colorFor(name),
    initials: initials(name),
  };

  return (
    <div
      className="h-screen overflow-hidden grid"
      style={{
        gridTemplateColumns: "250px 1fr",
        gridTemplateRows: "60px 1fr",
        gridTemplateAreas: '"brand top" "side main"',
      }}
    >
      <div
        className="flex items-center gap-2.5 px-[18px] border-r border-b border-border bg-surface"
        style={{ gridArea: "brand" }}
      >
        <div className="w-[26px] h-[26px] rounded-[7px] grid place-items-center text-white font-extrabold text-sm"
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
          A
        </div>
        <b className="text-[15px] tracking-tight">AgencyOS</b>
      </div>
      <Topbar user={user} />
      <Sidebar items={items} user={user} workspace={ctx.workspace.name} />
      <main className="overflow-y-auto px-[26px] pt-[22px] pb-[60px]" style={{ gridArea: "main" }}>
        {children}
      </main>
    </div>
  );
}
