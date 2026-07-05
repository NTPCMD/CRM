import { listRolesWithPermissions } from "@/lib/more-queries";
import { PageHeader, Card, CardHeader, CardBody, Empty } from "@/components/ui";
import { PermissionMatrix } from "@/components/permission-matrix";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const roles = await listRolesWithPermissions();
  const forMatrix = roles.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    grants_all: r.grants_all,
    keys: (r.role_permissions ?? []).map((rp) => rp.permissions?.key).filter(Boolean) as string[],
  }));

  return (
    <>
      <PageHeader title="Permissions" subtitle="Capabilities per role — editable live, no new roles required." />
      <Card>
        <CardHeader title="Permission matrix" />
        <CardBody className="pt-1.5">
          {forMatrix.length ? (
            <PermissionMatrix roles={forMatrix} />
          ) : (
            <Empty title="No roles found" hint="Roles are seeded when a workspace is created." />
          )}
        </CardBody>
      </Card>
    </>
  );
}
