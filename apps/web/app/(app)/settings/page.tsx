import { getContext } from "@/lib/session";
import { PageHeader, Card, CardHeader, CardBody, Empty } from "@/components/ui";
import { WorkspaceSettingsForm } from "@/components/forms/workspace-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await getContext();
  const ws = ctx?.workspace;

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your workspace." />
      <div className="max-w-[520px]">
        <Card>
          <CardHeader title="Workspace" />
          <CardBody>
            {ws ? (
              <WorkspaceSettingsForm workspace={{ name: ws.name, timezone: ws.timezone, country: ws.country }} />
            ) : (
              <Empty title="No workspace" hint="Create a workspace first." />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
