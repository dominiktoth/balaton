"use client"

import { useState } from "react"
import { supabase } from "~/server/auth/supabaseClient"
import { api } from "~/trpc/react"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import type { Store, User } from "@prisma/client"

export default function AddUserPage() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("admin")
  const [storeId, setStoreId] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const createUser = api.user.createUser.useMutation()
  const { data: stores, isLoading: storesLoading } = api.store.getAllStores.useQuery()
  const { data: users, isLoading: usersAreLoading, refetch } = api.user.getAll.useQuery()

  const handleValueChange = (value: string) => {
    setRole(value)
    const selectedStore = stores?.find((store: Store) => store.name === value)
    if (selectedStore) {
      setStoreId(selectedStore.id)
    } else {
      setStoreId("")
    }
  }

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      })

      await createUser.mutateAsync({
        email,
        password,
        role,
        storeId: role !== "admin" ? storeId : undefined,
        name: role,
      })

      setSuccess("User created!")
      setEmail("")
      setPassword("")
      setRole("admin")
      setStoreId("")
      refetch()
      setOpen(false)
    } catch (err) {
      setError(err as string)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
              </div>

              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={handleValueChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">admin</SelectItem>
                    {!storesLoading &&
                      stores?.map((store: Store) => (
                        <SelectItem key={store.id} value={store.name}>
                          {store.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}

              <DialogFooter className="pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Add User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {usersAreLoading ? (
        <p>Loading users...</p>
      ) : users && users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {users.map((user) => {
            const storeName = user.store?.name || "N/A";
            return (
              <Card key={user.id}>
                <CardHeader>
                  <CardTitle>{user.email}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Role: <strong>{user.role}</strong></p>
                  {storeName !== "N/A" && <p>Store: <strong>{storeName}</strong></p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  )
}
