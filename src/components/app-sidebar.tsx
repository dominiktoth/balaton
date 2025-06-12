"use client"

import * as React from "react"
import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconInnerShadowTop,
  IconShoppingCart,
  IconPackage,
  IconToolsKitchen2,
  IconBrandCashapp,
  IconBeach,
  IconUser
} from "@tabler/icons-react"

import { NavMain } from "~/components/nav-main"
import { NavUser } from "~/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { supabase } from "~/server/auth/supabaseClient"



const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Üzletek",
      url: "/dashboard/stores",
      icon: IconShoppingCart,
    },
    {
      title: "Termékek",
      url: "/dashboard/products",
      icon: IconToolsKitchen2,
    },
    {
      title: "Rendelés",
      url: "/dashboard/orders",
      icon: IconPackage,
    },
    {
      title: "Felhasználók",
      url: "/dashboard/users",
      icon: IconUser,
    },
    {
      title: "Kiadások",
      url: "/dashboard/expenses",
      icon: IconBrandCashapp,
    },


  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user , setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)

  React.useEffect(() => {
    supabase.auth.getUser().then((response) => {
      if (response.data?.user) {
        setUser({
          name: response.data.user.email|| "Unknown",
          email: response.data.user.role || "Unknown",
          avatar: response.data.user.user_metadata.avatar_url || "",
        });
      }
    });
  }, []);
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconBeach className="!size-5 text-blue-400" />
                <span className="text-base font-semibold">Balaton Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />

      </SidebarContent>
      <SidebarFooter>
{  user&&      <NavUser  user={user}/>
}      
</SidebarFooter>
    </Sidebar>
  )
}
