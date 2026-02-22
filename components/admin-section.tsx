"use client"

import { useState } from "react"
import {
  Users,
  Shield,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { users as initialUsers, type User, type UserRole } from "@/lib/hotel-data"

const rolePermissions: Record<UserRole, string[]> = {
  receptionist: [
    "Create/Modify/Cancel Reservations",
    "Check Availability",
    "Check-in/Check-out Guests",
    "Add Services to Stay",
    "Generate Invoices",
    "Record Payments",
    "View Reservation List",
  ],
  operational: [
    "Update Room Status",
    "Register Inventory Usage",
    "View Inventory Levels",
  ],
  administrator: [
    "Manage Users",
    "Assign Roles/Permissions",
    "Manage Rooms & Tables",
    "Manage Price List",
    "View Reports",
    "All Receptionist Permissions",
    "All Operational Permissions",
  ],
}

const roleBadgeVariant: Record<UserRole, "default" | "secondary" | "outline"> = {
  administrator: "default",
  receptionist: "secondary",
  operational: "outline",
}

export function AdminSection() {
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "receptionist" as UserRole,
  })

  function handleCreateUser() {
    const user: User = {
      id: `u-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      active: true,
      lastLogin: "Never",
    }
    setAllUsers((prev) => [...prev, user])
    setDialogOpen(false)
    setNewUser({ name: "", email: "", role: "receptionist" })
  }

  function toggleUserActive(userId: string) {
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, active: !u.active } : u
      )
    )
  }

  function changeUserRole(userId: string, role: UserRole) {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and manage user accounts and role assignments
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the hotel management system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="userName">Full Name</Label>
                <Input
                  id="userName"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="user@hoteldesk.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) =>
                    setNewUser({ ...newUser, role: v as UserRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="operational">
                      Operational Staff
                    </SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={!newUser.name || !newUser.email}
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Users</CardTitle>
          <CardDescription>
            Manage accounts, toggle active status, and assign roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(v) =>
                          changeUserRole(user.id, v as UserRole)
                        }
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receptionist">
                            Receptionist
                          </SelectItem>
                          <SelectItem value="operational">
                            Operational
                          </SelectItem>
                          <SelectItem value="administrator">
                            Administrator
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {user.active ? (
                          <CheckCircle2 className="size-3.5 text-success" />
                        ) : (
                          <XCircle className="size-3.5 text-muted-foreground" />
                        )}
                        <span
                          className={`text-sm ${user.active ? "text-success" : "text-muted-foreground"}`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={user.active}
                          onCheckedChange={() => toggleUserActive(user.id)}
                          aria-label={`Toggle ${user.name} active status`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4 text-primary" />
            Role Permissions Matrix
          </CardTitle>
          <CardDescription>
            Overview of permissions assigned to each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.entries(rolePermissions) as [UserRole, string[]][]).map(
              ([role, perms]) => (
                <div
                  key={role}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant={roleBadgeVariant[role]} className="capitalize">
                      {role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      (
                      {allUsers.filter((u) => u.role === role && u.active).length}{" "}
                      active)
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {perms.map((perm) => (
                      <li
                        key={perm}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
