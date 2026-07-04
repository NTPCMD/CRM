import { PageHeader, Card, CardBody, Empty } from "./ui";

export function Placeholder({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle ?? "Part of the AgencyOS specification."} />
      <Card>
        <CardBody>
          <Empty
            title={`${title} — designed, wiring in progress`}
            hint="This screen shares the same shell, design system, and permission model as the built modules. Data wiring lands next."
          />
        </CardBody>
      </Card>
    </>
  );
}
