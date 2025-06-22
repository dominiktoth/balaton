"use client"

import {
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react"
import { useMemo } from "react"

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"

export function SectionCards({
  storeId,
  expenses = [],
  incomes = [],
}: {
  storeId: string
  expenses: { storeId: string; amount: number }[]
  incomes: { storeId: string; amount: number }[]
}) {
  const filteredExpenses = useMemo(() => {
    return storeId === "all"
      ? expenses
      : expenses.filter((e) => e.storeId === storeId)
  }, [expenses, storeId])

  const filteredIncomes = useMemo(() => {
    return storeId === "all"
      ? incomes
      : incomes.filter((i) => i.storeId === storeId)
  }, [incomes, storeId])

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0)
  const profit = totalIncome - totalExpense

  const formatter = new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
  })

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@ w-full">
        <CardHeader>
          <CardDescription>Összes bevétel</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatter.format(totalIncome)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Bevételi trend <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Alapul véve az utolsó {filteredIncomes.length} tranzakciót
          </div>
        </CardFooter>
      </Card>
      <Card className="@ w-full">
        <CardHeader>
          <CardDescription>Összes kiadás</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatter.format(totalExpense)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Kiadási trend <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Alapul véve az utolsó {filteredExpenses.length} tranzakciót
          </div>
        </CardFooter>
      </Card>
      <Card className="@ w-full">
        <CardHeader>
          <CardDescription>Profit</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatter.format(profit)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Nyereség (bevétel - kiadás)
          </div>
          <div className="text-muted-foreground">
            A kiválasztott bolt vagy összes bolt eredménye
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
