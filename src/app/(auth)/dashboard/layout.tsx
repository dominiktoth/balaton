"use client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { AppSidebar } from "~/components/app-sidebar";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { persistor, store } from "~/store/store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />

            <main>{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </PersistGate>
    </Provider>
  );
}
