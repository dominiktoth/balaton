"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconDashboard,
  IconShoppingCart,
  IconBeach,
  IconUser,
  IconUsers,
  IconClock,
  IconCurrencyForint,
  IconPigMoney,
  IconChevronDown,
  IconCheck,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { supabase } from "~/server/auth/supabaseClient"
import { api } from "~/trpc/react"

function buildNav(strandSlug: string) {
  const base = `/dashboard/${strandSlug}`
  return [
    { title: "Dashboard", url: base, icon: IconDashboard },
    { title: "Üzletek", url: `${base}/stores`, icon: IconShoppingCart },
    { title: "Felhasználók", url: `${base}/users`, icon: IconUser },
    { title: "Dolgozók", url: `${base}/workers`, icon: IconUsers },
    { title: "Ledolgozott órák", url: `${base}/workshifts`, icon: IconClock },
    { title: "Pénzügyek", url: `${base}/finances`, icon: IconCurrencyForint },
    { title: "Befektetések", url: `${base}/investments`, icon: IconPigMoney },
  ]
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  currentStrandSlug: string
}

export function AppSidebar({ currentStrandSlug, ...props }: AppSidebarProps) {
  const router = useRouter()
  const { data: strands = [] } = api.strand.getAll.useQuery()
  const current = strands.find((s) => s.slug === currentStrandSlug)

  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)

  React.useEffect(() => {
    supabase.auth.getUser().then((response) => {
      if (response.data?.user) {
        setUser({
          name: response.data.user.email || "Unknown",
          email: response.data.user.role || "Unknown",
          avatar: response.data.user.user_metadata.avatar_url || "",
        })
      }
    })
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-300 text-white shadow-md">
                    <IconBeach className="size-5" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Strand
                    </span>
                    <span className="truncate text-sm font-semibold">
                      {current?.name ?? "Válassz strandot"}
                    </span>
                  </div>
                  <IconChevronDown className="ml-auto size-4 opacity-60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={6}
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <DropdownMenuLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Strandok
                </DropdownMenuLabel>
                {strands.map((strand) => (
                  <DropdownMenuItem
                    key={strand.id}
                    onSelect={() => router.push(`/dashboard/${strand.slug}`)}
                    className="flex items-center gap-2"
                  >
                    <IconBeach className="size-4 text-blue-400" />
                    <span className="flex-1">{strand.name}</span>
                    {strand.slug === currentStrandSlug && (
                      <IconCheck className="size-4 text-emerald-500" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push("/dashboard")}>
                  Strand választó
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={buildNav(currentStrandSlug)} />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  )
}
