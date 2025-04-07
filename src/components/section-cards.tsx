'use client'

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useMemo } from "react"

import { Badge } from "~/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { api } from "~/trpc/react"

export function SectionCards({ storeId }: { storeId: string }) {
  const { data: expenses, isLoading } = api.expense.getAllExpenses.useQuery()
  const { data: stores } = api.store.getAllStores.useQuery()

  const filteredExpenses = useMemo(() => {
    if (!expenses) return []
    return storeId === "all"
      ? expenses
      : expenses.filter((e) => e.storeId === storeId)
  }, [expenses, storeId])

  const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  const formatter = new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
  })

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 ">
      {/* Összes kiadás */}
      <Card className="@ w-full">
        <CardHeader>
          <CardDescription>Összes kiadás</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatter.format(total)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Általános költési trend <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Alapul véve az utolsó {filteredExpenses.length} tranzakciót
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
