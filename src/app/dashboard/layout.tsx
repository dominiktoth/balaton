

import { AppSidebar } from "~/components/app-sidebar";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";




export default function DashboardLayout({ children }: { children: React.ReactNode }) {



  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
