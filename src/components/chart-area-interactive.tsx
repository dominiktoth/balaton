"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useIsMobile } from "~/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group"

export function ChartAreaInteractive({
  storeId,
  expenses = [],
}: {
  storeId: string
  expenses: { date: string; storeId: string; amount: number }[]
}) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredExpenses = React.useMemo(() => {
    const referenceDate = new Date()
    const startDate = new Date(referenceDate)

    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    startDate.setDate(referenceDate.getDate() - days)

    return expenses
      .filter((e) => {
        const date = new Date(e.date)
        return (
          date >= startDate &&
          (storeId === "all" || e.storeId === storeId)
        )
      })
      .map((e) => ({
        date: new Date(e.date).toISOString().split("T")[0],
        amount: e.amount,
      }))
  }, [expenses, storeId, timeRange])

  const chartData = React.useMemo(() => {
    const result: Record<string, number> = {}

    for (const e of filteredExpenses) {
      if (e.date) {
        result[e.date] = (result[e.date] ?? 0) + e.amount
      }
    }

    return Object.entries(result)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredExpenses])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Kiadások alakulása</CardTitle>
        <CardDescription>
          {storeId === "all" ? "Összes bolt" : `Bolt azonosító: ${storeId}`} –
          Utolsó {timeRange}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => val && setTimeRange(val)}
            variant="outline"
            className="hidden @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">90 nap</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 nap</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 nap</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(val) => setTimeRange(val)}>
            <SelectTrigger className="w-40 @[767px]/card:hidden" size="sm">
              <SelectValue placeholder="Időtartomány kiválasztása" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d">Utolsó 90 nap</SelectItem>
              <SelectItem value="30d">Utolsó 30 nap</SelectItem>
              <SelectItem value="7d">Utolsó 7 nap</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={{
            amount: {
              label: "Kiadás",
              color: "var(--primary)",
            },
          }}
          className="aspect-auto h-[250px] w-full"
        >
<BarChart data={chartData} barSize={24}   margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
>
  <CartesianGrid vertical={false} />
  <XAxis
    dataKey="date"
    tickLine={false}
    axisLine={false}
    tickMargin={8}
    minTickGap={32}
    interval="preserveStartEnd"
    tickFormatter={(value) =>
      new Date(value).toLocaleDateString("hu-HU", {
        month: "short",
        day: "numeric",
      })
    }
  />
  <YAxis
    tickLine={false}
    axisLine={false}
    tickFormatter={(value) => `${value.toLocaleString()} Ft`}
  />
  <ChartTooltip
    cursor={{ fill: "var(--muted)" }}
    defaultIndex={isMobile ? -1 : 10}
    content={
      <ChartTooltipContent
        labelFormatter={(value: string | number | Date) =>
          new Date(value).toLocaleDateString("hu-HU", {
            month: "short",
            day: "numeric",
          })
        }
        indicator="dashed"
      />
    }
  />
  <Bar
dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={24}
  />
</BarChart>

        </ChartContainer>
      </CardContent>
    </Card>
  )
}
