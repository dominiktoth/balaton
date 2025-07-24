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

// Helper function to format numbers in millions
const formatToMillions = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}m`;
  } else if (value >= 1000) {
    return `${(value / 1000)}k`;
  }
  return value.toString();
};

export function ChartAreaInteractive({
  storeId,
  expenses = [],
  incomes = [],
  onBarClick,
}: {
  storeId: string
  expenses: { date: string; storeId: string; amount: number }[]
  incomes?: { date: string; storeId: string; amount: number }[]
  onBarClick?: (date: string) => void
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
  }, [expenses, storeId, timeRange]) || [];

  const filteredIncomes = React.useMemo(() => {
    const referenceDate = new Date()
    const startDate = new Date(referenceDate)
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    startDate.setDate(referenceDate.getDate() - days)
    return (incomes || [])
      .filter((i) => {
        const date = new Date(i.date)
        return (
          date >= startDate &&
          (storeId === "all" || i.storeId === storeId)
        )
      })
      .map((i) => ({
        date: new Date(i.date).toISOString().split("T")[0],
        amount: i.amount,
      }))
  }, [incomes, storeId, timeRange]) || [];

  // Merge data by date for chart
  const chartData = React.useMemo(() => {
    const map: Record<string, { date: string; expense: number; income: number }> = {}
    for (const e of filteredExpenses) {
      const dateKey = e?.date || '';
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = { date: dateKey, expense: 0, income: 0 }
        map[dateKey].expense += e.amount
      }
    }
    for (const i of filteredIncomes) {
      const dateKey = i?.date || '';
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = { date: dateKey, expense: 0, income: 0 }
        map[dateKey].income += i.amount
      }
    }
    return Object.values(map).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredExpenses, filteredIncomes])

  // Calculate Y-axis ticks in 1 million increments
  const yAxisTicks = React.useMemo(() => {
    const maxValue = Math.max(
      ...chartData.map(d => Math.max(d.expense, d.income))
    );
    const maxMillion = Math.ceil(maxValue / 1000000);
    const ticks = [];
    for (let i = 0; i <= maxMillion; i++) {
      ticks.push(i * 1000000);
    }
    return ticks;
  }, [chartData]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Kiadások és bevételek alakulása</CardTitle>
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
            expense: {
              label: "Kiadás",
              color: "var(--primary)",
            },
            income: {
              label: "Bevétel",
              color: "#22c55e",
            },
          }}
          className="aspect-auto h-[250px] w-full"
        >
<BarChart
  data={chartData}
  barSize={24}
  margin={{ top: 10, right: 30, left: 60, bottom: 5 }}
  onClick={(state) => {
    if (onBarClick && state && state.activeLabel) {
      onBarClick(state.activeLabel);
    }
  }}
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
    tickFormatter={(value) => `${formatToMillions(Number(value))} Ft`}
    domain={[0, 'auto']}
    ticks={yAxisTicks}
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
    dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={24}
  />
  <Bar
    dataKey="expense" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={24}
  />
</BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
