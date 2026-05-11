import { notFound } from "next/navigation";
import { AppSidebar } from "~/components/app-sidebar";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { getStrandBySlug } from "~/server/api/services/strand.service";

export default async function StrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ strand: string }>;
}) {
  const { strand: slug } = await params;
  const strand = await getStrandBySlug(slug);
  if (!strand) notFound();

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" currentStrandSlug={strand.slug} />
      <SidebarInset>
        <SiteHeader strandName={strand.name} />
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
