import Link from "next/link";
import { IconArrowsExchange, IconBeach } from "@tabler/icons-react";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";

export function SiteHeader({ strandName }: { strandName?: string }) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {strandName && (
          <div className="flex items-center gap-2">
            <IconBeach className="size-4 text-blue-400" />
            <span className="text-sm font-semibold">{strandName}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <IconArrowsExchange className="size-3.5" />
            Strand váltás
          </Link>
        </div>
      </div>
    </header>
  );
}
