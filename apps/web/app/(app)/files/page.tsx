import { listFiles } from "@/lib/more-queries";
import { PageHeader, Card, CardBody, Pill, Empty, Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

function sizeLabel(bytes: number | null) {
  if (!bytes) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let n = bytes, i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

export default async function FilesPage() {
  const files = await listFiles();
  return (
    <>
      <PageHeader
        title="Files"
        subtitle={`${files.length} ${files.length === 1 ? "file" : "files"}`}
        actions={<Button variant="primary"><Icon name="Download" className="w-4 h-4" /> Upload</Button>}
      />
      <Card>
        <CardBody className="p-0">
          {files.length ? (
            files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-3.5 py-3 border-t border-border first:border-0 hover:bg-card2">
                <div className="w-[34px] h-[34px] rounded-[9px] grid place-items-center flex-none bg-card2 text-muted">
                  <Icon name="File" className="w-[17px] h-[17px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{f.name}</div>
                  <div className="text-[11.5px] text-faint">{f.projects?.name ?? "Workspace"} · {timeAgo(f.created_at)}</div>
                </div>
                {f.is_client_visible ? <Pill tone="blue">Client-visible</Pill> : <Pill tone="grey">Internal</Pill>}
                <span className="text-[12px] text-muted num w-[72px] text-right">{sizeLabel(f.size_bytes)}</span>
              </div>
            ))
          ) : (
            <Empty title="No files yet" hint="Upload files to a project. Client-visible files appear in the client portal." />
          )}
        </CardBody>
      </Card>
    </>
  );
}
