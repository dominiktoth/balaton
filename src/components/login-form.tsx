"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { supabase } from "~/server/auth/supabaseClient"
import Image from "next/image"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push(redirectTo)
    }
  }

  const handleOAuth = async (provider: "google") => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`, // 👈 make sure this route exists
      },
    })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="p-0 overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2 h-full">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold">Üdv újra!</h1>
                <p className="text-muted-foreground">
                  Jelentkezz be a fiókodba
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="pelda@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Jelszó</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <Button type="submit" disabled={loading}>
                {loading ? "Bejelentkezés..." : "Bejelentkezés"}
              </Button>

              <div className="relative text-center text-sm after:border-t after:absolute after:w-full after:top-1/2 after:left-0">
                <span className="bg-card px-2 relative z-10 text-muted-foreground">
                  vagy folytasd a következővel
                </span>
              </div>
              <p className="text-center text-sm">
                Nincs fiókod? <a href="/signup" className="underline">Regisztrálj</a>
              </p>
            </div>
          </form>

          <div className=" md:block bg-muted h-full relative">
            <Image
              src="/login.png"
              fill
              alt="Image"
              className="object-cover h-full w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
