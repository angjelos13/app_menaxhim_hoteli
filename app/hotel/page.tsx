"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardOverview } from "@/components/dashboard-overview"
import { ReservationsSection } from "@/components/reservations-section"
import { CheckinSection } from "@/components/checkin-section"
import { InvoicingSection } from "@/components/invoicing-section"
import { RoomsSection } from "@/components/rooms-section"
import { TablesSection } from "@/components/tables-section"
import { InventorySection } from "@/components/inventory-section"
import { AdminSection } from "@/components/admin-section"
import { SettingsSection } from "@/components/settings-section"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const sectionTitles: Record<string, { label: string; group: string }> = {
  dashboard: { label: "Dashboard", group: "Receptionist" },
  reservations: { label: "Reservations", group: "Receptionist" },
  checkin: { label: "Check-in / Check-out", group: "Receptionist" },
  invoicing: { label: "Invoicing & Payments", group: "Receptionist" },
  rooms: { label: "Rooms", group: "Operations" },
  tables: { label: "Restaurant Tables", group: "Operations" },
  inventory: { label: "Inventory", group: "Operations" },
  users: { label: "User Management", group: "Administrator" },
  settings: { label: "Settings", group: "Administrator" },
}

export default function HotelManagementPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("dashboard")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentSection = sectionTitles[activeSection] || {
    label: "Dashboard",
    group: "Receptionist",
  }

  return (
    <SidebarProvider>
      <AppSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <span className="text-muted-foreground">
                  {currentSection.group}
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentSection.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {activeSection === "dashboard" && <DashboardOverview />}
          {activeSection === "reservations" && <ReservationsSection />}
          {activeSection === "checkin" && <CheckinSection />}
          {activeSection === "invoicing" && <InvoicingSection />}
          {activeSection === "rooms" && <RoomsSection />}
          {activeSection === "tables" && <TablesSection />}
          {activeSection === "inventory" && <InventorySection />}
          {activeSection === "users" && <AdminSection />}
          {activeSection === "settings" && <SettingsSection />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
