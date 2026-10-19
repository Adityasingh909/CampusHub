import { Construction } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export function PlaceholderPage({ title, description }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Screen coming in a later phase"
        description="The dashboard shell, sidebar, and routing are in place. This page will be implemented from the CampusHub designs next."
      />
    </>
  );
}
