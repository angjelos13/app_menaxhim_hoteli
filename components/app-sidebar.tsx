"use client"

import {
  Hotel,
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  UtensilsCrossed,
  UserCheck,
  FileText,
  Package,
  Users,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

const receptionistItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Reservations", icon: CalendarDays, id: "reservations" },
  { title: "Check-in / Check-out", icon: UserCheck, id: "checkin" },
  { title: "Invoicing & Payments", icon: FileText, id: "invoicing" },
]

const operationsItems = [
  { title: "Rooms", icon: DoorOpen, id: "rooms" },
  { title: "Restaurant Tables", icon: UtensilsCrossed, id: "tables" },
  { title: "Inventory", icon: Package, id: "inventory" },
]

const adminItems = [
  { title: "User Management", icon: Users, id: "users" },
  { title: "Settings", icon: Settings, id: "settings" },
]

function getSectionsForRole(role: string | undefined) {
  const sections: { label: string; items: typeof receptionistItems }[] = []
  if (!role) return sections

  const r = role.toLowerCase()
  if (r === "administrator" || r === "receptionist") {
    sections.push({ label: "Receptionist", items: receptionistItems })
  }
  if (r === "administrator" || r === "operational") {
    sections.push({ label: "Operations", items: operationsItems })
  }
  if (r === "administrator") {
    sections.push({ label: "Administrator", items: adminItems })
  }

  return sections
}

export function AppSidebar({
  activeSection,
  onNavigate,
}: {
  activeSection: string
  onNavigate: (section: string) => void
}) {
  const { user, logout } = useAuth()
  const sections = getSectionsForRole(user?.role)

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Hotel className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              HotelDesk
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Management System
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {sections.map((section) => (
          <Collapsible key={section.label} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  {section.label}
                  <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activeSection === item.id}
                          onClick={() => onNavigate(item.id)}
                          tooltip={item.title}
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
              {user?.username?.slice(0, 2).toUpperCase() ?? "??"}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-sidebar-foreground">
                {user?.username ?? "Not logged in"}
              </span>
              <span className="text-xs text-sidebar-foreground/60 capitalize">
                {user?.role ?? ""}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={logout}
            aria-label="Log out"
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
