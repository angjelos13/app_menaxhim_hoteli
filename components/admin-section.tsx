"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Shield,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
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
import { apiFetch } from "@/lib/api"

type UserRole = "Receptionist" | "Operational" | "Administrator"

interface UserRow {
  userId: number
  username: string
  role: UserRole
  isActive: boolean
}

const rolePermissions: Record<UserRole, string[]> = {
  Receptionist: [
    "Create/Modify/Cancel Reservations",
    "Check Availability",
    "Check-in/Check-out Guests",
    "Add Services to Stay",
    "Generate Invoices",
    "Record Payments",
    "View Reservation List",
  ],
  Operational: [
    "Update Room Status",
    "Register Inventory Usage",
    "View Inventory Levels",
  ],
  Administrator: [
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
  Administrator: "default",
  Receptionist: "secondary",
  Operational: "outline",
}

export function AdminSection() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "Receptionist" as UserRole })

  async function load() {
    setLoading(true)
    try {
      const data = await apiFetch("/api/users")
      setUsers(data)
    } catch { /* empty */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreateUser() {
    try {
      await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })
      await load()
      setDialogOpen(false)
      setNewUser({ username: "", password: "", role: "Receptionist" })
    } catch { /* empty */ }
  }

  async function toggleUserActive(userId: number, isActive: boolean) {
    try {
      await apiFetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !isActive }),
      })
      await load()
    } catch { /* empty */ }
  }

  async function changeUserRole(userId: number, role: UserRole) {
    try {
      await apiFetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      })
      await load()
    } catch { /* empty */ }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and manage user accounts and role assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" />Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the hotel management system</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="userName">Username</Label>
                <Input id="userName" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="Enter username" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="userPass">Password</Label>
                <Input id="userPass" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Enter password" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receptionist">Receptionist</SelectItem>
                    <SelectItem value="Operational">Operational Staff</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} disabled={!newUser.username || !newUser.password}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Users</CardTitle>
          <CardDescription>Manage accounts, toggle active status, and assign roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground">{user.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={user.role} onValueChange={(v) => changeUserRole(user.userId, v as UserRole)}>
                        <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Receptionist">Receptionist</SelectItem>
                          <SelectItem value="Operational">Operational</SelectItem>
                          <SelectItem value="Administrator">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {user.isActive ? <CheckCircle2 className="size-3.5 text-success" /> : <XCircle className="size-3.5 text-muted-foreground" />}
                        <span className={`text-sm ${user.isActive ? "text-success" : "text-muted-foreground"}`}>{user.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch checked={user.isActive} onCheckedChange={() => toggleUserActive(user.userId, user.isActive)} aria-label={`Toggle ${user.username} active status`} />
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
            <Shield className="size-4 text-primary" />Role Permissions Matrix
          </CardTitle>
          <CardDescription>Overview of permissions assigned to each role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.entries(rolePermissions) as [UserRole, string[]][]).map(([role, perms]) => (
              <div key={role} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant={roleBadgeVariant[role]} className="capitalize">{role}</Badge>
                  <span className="text-xs text-muted-foreground">({users.filter((u) => u.role === role && u.isActive).length} active)</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {perms.map((perm) => (
                    <li key={perm} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />{perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
