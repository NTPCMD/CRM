import { listMembers, listRoles } from "@/lib/more-queries";
import { getContext } from "@/lib/session";
import { PageHeader, Card, CardBody, Table, Pill, Avatar, Empty, Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import Link from "next/link";
import { InviteMemberButton } from "@/components/forms/invite-member";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const [members, ctx, roles] = await Promise.all([listMembers(), getContext(), listRoles()]);
  const nameOf = (p: { first_name: string | null; last_name: string | null; email: string | null } | null) =>
    [p?.first_name, p?.last_name].filter(Boolean).join(" ") || p?.email || "Member";

  return (
    <>
      <PageHeader
        title="Team"
        subtitle={`${members.length} ${members.length === 1 ? "member" : "members"}`}
        actions={
          <>
            <Link href="/permissions"><Button><Icon name="Shield" className="w-4 h-4" /> Permissions</Button></Link>
            {ctx?.grantsAll && <InviteMemberButton roles={roles} />}
          </>
        }
      />
      <Card>
        <CardBody className="p-0 py-1.5">
          {members.length ? (
            <Table head={["Member", "Role", "Status"]}>
              {members.map((m) => {
                const name = nameOf(m.profiles);
                return (
                  <tr key={m.id} className="hover:bg-card2">
                    <td className="px-3.5 py-3 border-t border-border">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={name} size={30} />
                        <div>
                          <b>{name}</b>
                          <div className="text-[11.5px] text-faint">{m.profiles?.email ?? ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 border-t border-border text-muted">{m.roles?.name ?? "—"}</td>
                    <td className="px-3.5 py-3 border-t border-border">
                      <Pill tone={m.status === "active" ? "green" : m.status === "invited" ? "amber" : "grey"}>{m.status}</Pill>
                    </td>
                  </tr>
                );
              })}
            </Table>
          ) : (
            <Empty title="No members yet" hint="Invite workers and clients to collaborate in this workspace." />
          )}
        </CardBody>
      </Card>
    </>
  );
}
