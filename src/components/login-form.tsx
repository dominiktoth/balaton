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
import { useDispatch } from "react-redux"
import { login } from "~/store/userSlice"
import { api } from "~/trpc/react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [userEmail, setUserEmail] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")


  const dispatch = useDispatch();
  const dbUser = api.user.getByEmail.useMutation();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
  
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
  
      const { data: userData } = await supabase.auth.getUser();
  
      if (userData?.user) {
        const dbUserResult = await dbUser.mutateAsync({ email: userData.user.email! });
  
        dispatch(
          login({
            id: userData.user.id,
            name: userData.user.user_metadata?.name || "",
            email: userData.user.email ?? "",
            role: userData.user?.user_metadata?.role ?? "",
            storeId: dbUserResult?.storeId ?? "", // ✅ This should now be defined
          })
        );
  
        router.push(redirectTo);
      }
    } catch (err) {
      setError("Hiba történt a bejelentkezés során.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };
  


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
