"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";

import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { StatCard } from "~/components/stats/stat-card";
import { DataTable, type Column } from "~/components/stats/data-table";
import { Disclosure, FactRow, InsightList } from "~/components/stats/insights";
import { VizFrame, VizLegend, VIZ } from "~/components/stats/viz";
import {
  CumulativeChart,
  SeasonProgressChart,
  StoreChart,
  TrendChart,
  WeekdayChart,
} from "~/components/stats/charts";
import {
  buildCumulative,
  buildDailyBuckets,
  buildInsights,
  buildSeasonProgress,
  comparisonRange,
  computeTotals,
  dayKey,
  delta,
  diffDays,
  formatDay,
  formatDayFull,
  formatHuf,
  formatNumber,
  formatPercent,
  groupDaily,
  isActiveDay,
  isToDate,
  lastActiveDays,
  perStore,
  perWorker,
  resolvePeriod,
  scopeToStore,
  seasonRange,
  sumDays,
  todayKey,
  type GroupBucket,
  type GroupMode,
  type PeriodPreset,
  type StatsPayload,
  type StoreStat,
  type WorkerStat,
} from "~/lib/stats";

const EMPTY: StatsPayload = {
  stores: [],
  workers: [],
  incomes: [],
  expenses: [],
  investments: [],
  wages: [],
  shifts: [],
};

type WeekdayRow = GroupBucket & {
  avgProfit: number;
  index: number;
  incomePerShift: number;
  shiftsPerDay: number;
};
type BreakdownRow = GroupBucket & { change: number | null };

export default function StatisticsPage() {
  const params = useParams<{ strand: string }>();
  const strandSlug = params.strand;

  const currentYear = new Date().getUTCFullYear();
  // Szezon előtt még a tavalyi szezon az érdekes.
  const defaultYear =
    todayKey() < seasonRange(currentYear).from ? currentYear - 1 : currentYear;

  const [year, setYear] = useState(defaultYear);
  const [preset, setPreset] = useState<PeriodPreset>("season");
  const [custom, setCustom] = useState({
    from: seasonRange(defaultYear).from,
    to: todayKey(),
  });
  const [storeId, setStoreId] = useState("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("week");
  const [compareMode, setCompareMode] = useState<"previous" | "lastYear">(
    "lastYear",
  );
  const [progressMetric, setProgressMetric] = useState<"profit" | "income">(
    "profit",
  );

  /* ---------------- időszak ---------------- */

  const [firstActivity, setFirstActivity] = useState<string | null>(null);
  const range = useMemo(
    () => resolvePeriod(preset, year, custom, firstActivity),
    [preset, year, custom, firstActivity],
  );
  const compare = useMemo(
    () => comparisonRange(range, compareMode),
    [range, compareMode],
  );

  /* ---------------- adatok ---------------- */

  const { data, isPending } = api.stats.getStats.useQuery({
    strandSlug,
    from: range.from,
    to: range.to,
  });
  const { data: compareRaw } = api.stats.getStats.useQuery({
    strandSlug,
    from: compare.from,
    to: compare.to,
  });
  const { data: opening } = api.stats.getOpening.useQuery({
    strandSlug,
    before: range.from,
  });

  useEffect(() => {
    if (!opening?.firstActivity) return;
    const key = dayKey(opening.firstActivity);
    setFirstActivity((prev) => (prev === key ? prev : key));
  }, [opening?.firstActivity]);

  const payload = data ?? EMPTY;
  const scoped = useMemo(
    () => scopeToStore(payload, storeId),
    [payload, storeId],
  );
  const daily = useMemo(
    () => buildDailyBuckets(scoped, range.from, range.to),
    [scoped, range.from, range.to],
  );
  const totals = useMemo(() => computeTotals(daily, scoped), [daily, scoped]);

  const compareDaily = useMemo(() => {
    const scopedCompare = scopeToStore(compareRaw ?? EMPTY, storeId);
    return buildDailyBuckets(scopedCompare, compare.from, compare.to);
  }, [compareRaw, storeId, compare.from, compare.to]);

  const compareTotals = useMemo(
    () => computeTotals(compareDaily, scopeToStore(compareRaw ?? EMPTY, storeId)),
    [compareDaily, compareRaw, storeId],
  );

  /* ---------------- bontások ---------------- */

  const grouped = useMemo(
    () => groupDaily(daily, groupMode),
    [daily, groupMode],
  );

  const breakdown = useMemo<BreakdownRow[]>(
    () =>
      grouped.map((row, index) => {
        const prev = grouped[index - 1];
        return { ...row, change: prev ? delta(row.income, prev.income) : null };
      }),
    [grouped],
  );

  const weekdays = useMemo<WeekdayRow[]>(() => {
    const rows = groupDaily(daily, "weekday");
    const activeDays = rows.reduce((acc, r) => acc + r.activeDays, 0);
    const income = rows.reduce((acc, r) => acc + r.income, 0);
    const average = activeDays > 0 ? income / activeDays : 0;
    return rows.map((row) => ({
      ...row,
      avgProfit: row.activeDays > 0 ? row.profit / row.activeDays : 0,
      index: average > 0 ? (row.avgIncome / average) * 100 : 0,
      incomePerShift: row.shifts > 0 ? row.income / row.shifts : 0,
      shiftsPerDay: row.activeDays > 0 ? row.shifts / row.activeDays : 0,
    }));
  }, [daily]);

  const storeStats = useMemo<StoreStat[]>(
    () => perStore(payload, range.from, range.to),
    [payload, range.from, range.to],
  );

  const workerStats = useMemo<WorkerStat[]>(() => perWorker(scoped), [scoped]);

  const progress = useMemo(
    () => buildSeasonProgress(daily, compareDaily, progressMetric),
    [daily, compareDaily, progressMetric],
  );

  const cumulative = useMemo(
    () =>
      buildCumulative(
        daily,
        storeId === "all" && opening
          ? { profit: opening.profit, investment: opening.investment }
          : { profit: 0, investment: 0 },
      ),
    [daily, opening, storeId],
  );

  const topDays = useMemo(() => {
    const active = daily.filter(isActiveDay);
    const sorted = [...active].sort((a, b) => b.income - a.income);
    return { best: sorted.slice(0, 5), worst: sorted.slice(-5).reverse() };
  }, [daily]);

  /* ---------------- lendület + megállapítások ---------------- */

  const recentDays = useMemo(() => lastActiveDays(daily, 7), [daily]);
  const recentSum = useMemo(() => sumDays(recentDays), [recentDays]);
  const recentAvgProfit =
    recentDays.length > 0 ? recentSum.profit / recentDays.length : 0;

  const openAdvances = useMemo(
    () => workerStats.reduce((acc, w) => acc + w.advanceBalance, 0),
    [workerStats],
  );

  const toDate = isToDate(range);
  const compareLabel =
    compareMode === "lastYear"
      ? toDate
        ? "tavaly ugyaneddig a napig"
        : "tavaly ugyanebben az időszakban"
      : "a megelőző időszakban";

  const insights = useMemo(
    () =>
      buildInsights({
        daily,
        totals,
        compareTotals: compareRaw ? compareTotals : null,
        compareLabel,
        weekdays,
        stores: storeStats,
        workers: workerStats,
        allStores: storeId === "all",
      }),
    [
      daily,
      totals,
      compareTotals,
      compareRaw,
      compareLabel,
      weekdays,
      storeStats,
      workerStats,
      storeId,
    ],
  );

  const years = useMemo(() => {
    const first = firstActivity
      ? Number(firstActivity.slice(0, 4))
      : currentYear - 4;
    const list: number[] = [];
    for (let y = currentYear; y >= Math.min(first, currentYear); y--) list.push(y);
    return list;
  }, [firstActivity, currentYear]);

  const lastPoint = cumulative[cumulative.length - 1];
  const paybackNote = (() => {
    if (!lastPoint || lastPoint.investment <= 0) return null;
    if (lastPoint.net >= 0) {
      const day = cumulative.find((p) => p.net >= 0);
      return `A halmozott eredmény fedezi a befektetéseket${
        day ? ` (${formatDayFull(day.key)} óta)` : ""
      }.`;
    }
    return `A befektetésekből még ${formatHuf(-lastPoint.net)} nem térült meg.`;
  })();

  const periodTitle =
    preset === "season"
      ? `${year}. évi szezon${toDate ? " (eddig)" : ""}`
      : preset === "year"
        ? `${year}. év${toDate ? " (eddig)" : ""}`
        : preset === "last30"
          ? "Elmúlt 30 nap"
          : preset === "last7"
            ? "Elmúlt 7 nap"
            : preset === "all"
              ? "Teljes múlt"
              : "Egyéni időszak";

  const storeName =
    storeId === "all"
      ? "Összes üzlet"
      : (payload.stores.find((s) => s.id === storeId)?.name ?? "Üzlet");

  /* ---------------- táblák ---------------- */

  const periodHeader =
    groupMode === "week" ? "Hét" : groupMode === "month" ? "Hónap" : "Nap";

  const breakdownColumns: Column<BreakdownRow>[] = [
    {
      key: "label",
      header: periodHeader,
      render: (row) => (
        <div>
          <div className="font-medium">{row.label}</div>
          {row.sublabel && (
            <div className="text-muted-foreground text-xs">{row.sublabel}</div>
          )}
        </div>
      ),
      csv: (row) => `${row.label}${row.sublabel ? ` (${row.sublabel})` : ""}`,
    },
    {
      key: "activeDays",
      header: "Nyitott nap",
      align: "right",
      render: (row) => row.activeDays,
      csv: (row) => row.activeDays,
    },
    {
      key: "income",
      header: "Bevétel",
      align: "right",
      render: (row) => formatHuf(row.income),
      csv: (row) => Math.round(row.income),
    },
    {
      key: "expense",
      header: "Kiadás",
      align: "right",
      render: (row) => formatHuf(row.expense),
      csv: (row) => Math.round(row.expense),
    },
    {
      key: "wage",
      header: "Munkabér",
      align: "right",
      render: (row) => formatHuf(row.wage),
      csv: (row) => Math.round(row.wage),
    },
    {
      key: "profit",
      header: "Eredmény",
      align: "right",
      render: (row) => (
        <span className={row.profit < 0 ? "text-rose-600 dark:text-rose-400" : ""}>
          {formatHuf(row.profit)}
        </span>
      ),
      csv: (row) => Math.round(row.profit),
    },
    {
      key: "wageRatio",
      header: "Bérhányad",
      align: "right",
      render: (row) => (row.income > 0 ? formatPercent(row.wageRatio) : "–"),
      csv: (row) => Math.round(row.wageRatio),
    },
    {
      key: "avgIncome",
      header: "Napi átlag",
      align: "right",
      render: (row) => formatHuf(row.avgIncome),
      csv: (row) => Math.round(row.avgIncome),
    },
    {
      key: "change",
      header: "Változás",
      align: "right",
      render: (row) =>
        row.change === null ? (
          <span className="text-muted-foreground">–</span>
        ) : (
          <span
            className={
              row.change >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
          >
            {row.change >= 0 ? "+" : "−"}
            {formatPercent(Math.abs(row.change), 0)}
          </span>
        ),
      csv: (row) => (row.change === null ? "" : Math.round(row.change)),
    },
  ];

  const weekdayColumns: Column<WeekdayRow>[] = [
    {
      key: "label",
      header: "Nap",
      render: (row) => <span className="font-medium">{row.label}</span>,
      csv: (row) => row.label,
    },
    {
      key: "activeDays",
      header: "Nyitott nap",
      align: "right",
      render: (row) => row.activeDays,
      csv: (row) => row.activeDays,
    },
    {
      key: "shiftsPerDay",
      header: "Átlag létszám",
      align: "right",
      render: (row) => formatNumber(row.shiftsPerDay, 1),
      csv: (row) => Number(row.shiftsPerDay.toFixed(1)),
    },
    {
      key: "avgIncome",
      header: "Átlag bevétel",
      align: "right",
      render: (row) => formatHuf(row.avgIncome),
      csv: (row) => Math.round(row.avgIncome),
    },
    {
      key: "incomePerShift",
      header: "Bevétel / műszak",
      align: "right",
      render: (row) => (
        <span className="font-medium">{formatHuf(row.incomePerShift)}</span>
      ),
      csv: (row) => Math.round(row.incomePerShift),
    },
    {
      key: "avgProfit",
      header: "Átlag eredmény",
      align: "right",
      render: (row) => (
        <span
          className={row.avgProfit < 0 ? "text-rose-600 dark:text-rose-400" : ""}
        >
          {formatHuf(row.avgProfit)}
        </span>
      ),
      csv: (row) => Math.round(row.avgProfit),
    },
    {
      key: "wageRatio",
      header: "Bérhányad",
      align: "right",
      render: (row) => (row.income > 0 ? formatPercent(row.wageRatio) : "–"),
      csv: (row) => Math.round(row.wageRatio),
    },
    {
      key: "index",
      header: "Index",
      align: "right",
      render: (row) => (
        <span
          className={
            row.index >= 100
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          }
        >
          {formatPercent(row.index, 0)}
        </span>
      ),
      csv: (row) => Math.round(row.index),
    },
  ];

  const storeColumns: Column<StoreStat>[] = [
    {
      key: "name",
      header: "Üzlet",
      render: (row) => <span className="font-medium">{row.name}</span>,
      csv: (row) => row.name,
    },
    {
      key: "profit",
      header: "Eredmény",
      align: "right",
      render: (row) => (
        <span
          className={
            row.profit < 0 ? "font-medium text-rose-600 dark:text-rose-400" : "font-medium"
          }
        >
          {formatHuf(row.profit)}
        </span>
      ),
      csv: (row) => Math.round(row.profit),
    },
    {
      key: "margin",
      header: "Árrés",
      align: "right",
      render: (row) => (row.income > 0 ? formatPercent(row.margin) : "–"),
      csv: (row) => Math.round(row.margin),
    },
    {
      key: "income",
      header: "Bevétel",
      align: "right",
      render: (row) => formatHuf(row.income),
      csv: (row) => Math.round(row.income),
    },
    {
      key: "share",
      header: "Részesedés",
      align: "right",
      render: (row) => formatPercent(row.share),
      csv: (row) => Math.round(row.share),
    },
    {
      key: "expense",
      header: "Kiadás",
      align: "right",
      render: (row) => formatHuf(row.expense),
      csv: (row) => Math.round(row.expense),
    },
    {
      key: "wage",
      header: "Munkabér",
      align: "right",
      render: (row) => formatHuf(row.wage),
      csv: (row) => Math.round(row.wage),
    },
    {
      key: "wageRatio",
      header: "Bérhányad",
      align: "right",
      render: (row) => (row.income > 0 ? formatPercent(row.wageRatio) : "–"),
      csv: (row) => Math.round(row.wageRatio),
    },
    {
      key: "activeDays",
      header: "Nyitott nap",
      align: "right",
      render: (row) => row.activeDays,
      csv: (row) => row.activeDays,
    },
    {
      key: "incomePerShift",
      header: "Bevétel / műszak",
      align: "right",
      render: (row) => formatHuf(row.incomePerShift),
      csv: (row) => Math.round(row.incomePerShift),
    },
  ];

  const workerColumns: Column<WorkerStat>[] = [
    {
      key: "name",
      header: "Dolgozó",
      render: (row) => <span className="font-medium">{row.name}</span>,
      csv: (row) => row.name,
    },
    {
      key: "shifts",
      header: "Műszak",
      align: "right",
      render: (row) => row.shifts,
      csv: (row) => row.shifts,
    },
    {
      key: "wage",
      header: "Összes bér",
      align: "right",
      render: (row) => formatHuf(row.wage),
      csv: (row) => Math.round(row.wage),
    },
    {
      key: "avgWage",
      header: "Átlag / műszak",
      align: "right",
      render: (row) => formatHuf(row.avgWage),
      csv: (row) => Math.round(row.avgWage),
    },
    {
      key: "paid",
      header: "Kifizetve",
      align: "right",
      render: (row) => formatHuf(row.paid),
      csv: (row) => Math.round(row.paid),
    },
    {
      key: "unpaid",
      header: "Függőben",
      align: "right",
      render: (row) => (
        <span
          className={row.unpaid > 0 ? "text-amber-600 dark:text-amber-400" : ""}
        >
          {formatHuf(row.unpaid)}
        </span>
      ),
      csv: (row) => Math.round(row.unpaid),
    },
    {
      key: "advanceBalance",
      header: "Nyitott előleg",
      align: "right",
      render: (row) => formatHuf(row.advanceBalance),
      csv: (row) => Math.round(row.advanceBalance),
    },
  ];

  const rangeDays = diffDays(range.from, range.to) + 1;

  /* ---------------- render ---------------- */

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{periodTitle}</h1>
        <p className="text-muted-foreground text-sm">
          {storeName} · {formatDayFull(range.from)} – {formatDayFull(range.to)} (
          {rangeDays} nap) · bázis: {formatDay(compare.from)} –{" "}
          {formatDay(compare.to)}
        </p>
      </header>

      {/* Szűrők */}
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="season-select">Szezon</Label>
            <Select
              value={String(year)}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger id="season-select" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}. évi szezon
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Időszak</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={preset}
              onValueChange={(value) => value && setPreset(value as PeriodPreset)}
              className="flex-wrap justify-start"
            >
              <ToggleGroupItem value="season" className="px-3">
                Szezon
              </ToggleGroupItem>
              <ToggleGroupItem value="year" className="px-3">
                Teljes év
              </ToggleGroupItem>
              <ToggleGroupItem value="last30" className="px-3">
                30 nap
              </ToggleGroupItem>
              <ToggleGroupItem value="last7" className="px-3">
                7 nap
              </ToggleGroupItem>
              <ToggleGroupItem value="all" className="px-3">
                Teljes múlt
              </ToggleGroupItem>
              <ToggleGroupItem value="custom" className="px-3">
                Egyéni
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compare-select">Bázis</Label>
            <Select
              value={compareMode}
              onValueChange={(value) =>
                setCompareMode(value as "previous" | "lastYear")
              }
            >
              <SelectTrigger id="compare-select" className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastYear">Tavalyi év ugyanekkor</SelectItem>
                <SelectItem value="previous">Megelőző időszak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {preset === "custom" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="from-date">Kezdő dátum</Label>
                <Input
                  id="from-date"
                  type="date"
                  className="w-44"
                  value={custom.from}
                  onChange={(e) =>
                    setCustom((prev) => ({ ...prev, from: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="to-date">Záró dátum</Label>
                <Input
                  id="to-date"
                  type="date"
                  className="w-44"
                  value={custom.to}
                  onChange={(e) =>
                    setCustom((prev) => ({ ...prev, to: e.target.value }))
                  }
                />
              </div>
            </>
          )}
        </div>

        <Tabs value={storeId} onValueChange={setStoreId}>
          <TabsList className="scrollbar-hide flex w-full gap-2 overflow-x-auto px-1">
            <TabsTrigger
              value="all"
              className="border-muted bg-background hover:bg-muted data-[state=active]:bg-primary data-[state=active]:border-primary min-w-max rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition data-[state=active]:text-white"
            >
              Összes üzlet
            </TabsTrigger>
            {payload.stores.map((store) => (
              <TabsTrigger
                key={store.id}
                value={store.id}
                className="border-muted bg-background hover:bg-muted data-[state=active]:bg-primary data-[state=active]:border-primary min-w-max rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition data-[state=active]:text-white"
              >
                {store.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isPending ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <>
          {/* 1. Hol tartunk */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Eredmény"
              color={VIZ.profit}
              value={formatHuf(totals.profit)}
              delta={delta(totals.profit, compareTotals.profit)}
              deltaLabel={compareLabel}
              hint={`Bázis: ${formatHuf(compareTotals.profit)} (${compareLabel})`}
            />
            <StatCard
              label="Bevétel"
              color={VIZ.income}
              value={formatHuf(totals.income)}
              delta={delta(totals.income, compareTotals.income)}
              deltaLabel={compareLabel}
              hint={`Bázis: ${formatHuf(compareTotals.income)}`}
            />
            <StatCard
              label={`Napi eredmény (utolsó ${recentDays.length || 0} nap)`}
              value={formatHuf(recentAvgProfit)}
              delta={delta(recentAvgProfit, totals.avgProfit)}
              deltaLabel="az időszak napi átlagához képest"
              hint={`Időszaki napi átlag: ${formatHuf(totals.avgProfit)}`}
            />
            <StatCard
              label="Kint lévő pénz"
              value={formatHuf(totals.unpaidWage + openAdvances)}
              hint={`Függő bér ${formatHuf(totals.unpaidWage)} · nyitott előleg ${formatHuf(
                openAdvances,
              )}`}
            />
          </div>

          <FactRow
            facts={[
              { label: "Árrés", value: formatPercent(totals.margin) },
              { label: "Bérhányad", value: formatPercent(totals.wageRatio) },
              {
                label: "Napi átlagbevétel",
                value: formatHuf(totals.avgIncome),
              },
              {
                label: "Nyitott nap",
                value: `${formatNumber(totals.activeDays)} / ${formatNumber(rangeDays)}`,
              },
              { label: "Műszak", value: formatNumber(totals.shifts) },
              {
                label: "Bevétel / műszak",
                value: formatHuf(totals.incomePerShift),
              },
              {
                label: "Legjobb nap",
                value: totals.best
                  ? `${formatDay(totals.best.key)} – ${formatHuf(totals.best.income)}`
                  : "–",
              },
            ]}
          />

          <VizFrame
            title="Hol tartunk a bázishoz képest"
            description="Halmozott görbe az időszak első napjától – a szaggatott vonal a bázisidőszak ugyanennyiedik napja."
            action={
              <ToggleGroup
                type="single"
                variant="outline"
                value={progressMetric}
                onValueChange={(value) =>
                  value && setProgressMetric(value as "profit" | "income")
                }
              >
                <ToggleGroupItem value="profit" className="px-3">
                  Eredmény
                </ToggleGroupItem>
                <ToggleGroupItem value="income" className="px-3">
                  Bevétel
                </ToggleGroupItem>
              </ToggleGroup>
            }
            legend={
              <VizLegend
                items={[
                  {
                    key: "current",
                    label: periodTitle,
                    color:
                      progressMetric === "profit" ? VIZ.profit : VIZ.income,
                  },
                  {
                    key: "base",
                    label: `Bázis (${formatDay(compare.from)} – ${formatDay(compare.to)})`,
                    color: VIZ.axis,
                    dashed: true,
                  },
                ]}
              />
            }
          >
            <SeasonProgressChart
              data={progress}
              color={progressMetric === "profit" ? VIZ.profit : VIZ.income}
              metricLabel={progressMetric === "profit" ? "Eredmény" : "Bevétel"}
              baseLabel="Bázisidőszak"
            />
          </VizFrame>

          {/* 2. Mire figyelj */}
          <InsightList insights={insights} />

          {/* 3. Napi ritmus */}
          <VizFrame
            title="Napi ritmus – kire és mikor van szükség"
            description="A Bevétel / műszak oszlop mutatja, hogy egy beosztott ember mennyit termel az adott napon."
            legend={
              <VizLegend
                items={[
                  { key: "income", label: "Átlagos bevétel", color: VIZ.income },
                  { key: "profit", label: "Átlagos eredmény", color: VIZ.profit },
                  {
                    key: "avg",
                    label: "Napi átlag (minden nap együtt)",
                    color: VIZ.axis,
                    dashed: true,
                  },
                ]}
              />
            }
          >
            <div className="grid gap-6">
              <WeekdayChart data={weekdays} average={totals.avgIncome} />
              <DataTable
                columns={weekdayColumns}
                rows={weekdays}
                rowKey={(row) => row.key}
                rowClassName={(row) =>
                  row.avgProfit < 0 ? "bg-rose-50/60 dark:bg-rose-950/30" : undefined
                }
                csvFileName={`napi-ritmus-${range.from}_${range.to}.csv`}
              />
            </div>
          </VizFrame>

          {/* 4. Boltok */}
          <VizFrame
            title="Üzletek eredmény szerint"
            description="A strand összes üzlete, a legjobb eredménnyel az élen – az üzletszűrőtől függetlenül."
            legend={
              <VizLegend
                items={[
                  { key: "income", label: "Bevétel", color: VIZ.income },
                  { key: "profit", label: "Eredmény", color: VIZ.profit },
                ]}
              />
            }
          >
            <div className="grid gap-6">
              {storeStats.length > 0 && <StoreChart data={storeStats} />}
              <DataTable
                columns={storeColumns}
                rows={storeStats}
                rowKey={(row) => row.id}
                rowClassName={(row) =>
                  row.profit < 0 ? "bg-rose-50/60 dark:bg-rose-950/30" : undefined
                }
                csvFileName={`uzletek-${range.from}_${range.to}.csv`}
              />
            </div>
          </VizFrame>

          {/* 5. Részletek */}
          <Disclosure
            title="Időszaki bontás"
            description="Heti, havi vagy napi részletezés bevétel, kiadás, bér és eredmény szerint."
          >
            <div className="flex justify-end">
              <ToggleGroup
                type="single"
                variant="outline"
                value={groupMode}
                onValueChange={(value) => value && setGroupMode(value as GroupMode)}
              >
                <ToggleGroupItem value="day" className="px-3">
                  Napi
                </ToggleGroupItem>
                <ToggleGroupItem value="week" className="px-3">
                  Heti
                </ToggleGroupItem>
                <ToggleGroupItem value="month" className="px-3">
                  Havi
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <VizLegend
              items={[
                { key: "income", label: "Bevétel", color: VIZ.income },
                { key: "wage", label: "Munkabér", color: VIZ.wage },
                { key: "expense", label: "Kiadás", color: VIZ.expense },
                { key: "profit", label: "Eredmény", color: VIZ.profit },
              ]}
            />
            <TrendChart data={grouped} mode={groupMode} />
            <DataTable
              columns={breakdownColumns}
              rows={breakdown}
              rowKey={(row) => row.key}
              csvFileName={`bontas-${groupMode}-${range.from}_${range.to}.csv`}
            />
          </Disclosure>

          <Disclosure
            title="Munkaerő"
            description={`${formatNumber(totals.shifts)} műszak · átlagos napibér ${formatHuf(
              totals.wagePerShift,
            )} · a bér a bevétel ${formatPercent(totals.wageRatio)}-a`}
          >
            <DataTable
              columns={workerColumns}
              rows={workerStats}
              rowKey={(row) => row.id}
              csvFileName={`dolgozok-${range.from}_${range.to}.csv`}
              empty="Nincs rögzített műszak ebben az időszakban."
            />
          </Disclosure>

          <Disclosure
            title="Befektetések megtérülése"
            description={
              lastPoint && lastPoint.investment > 0
                ? (paybackNote ?? undefined)
                : "Halmozott eredmény és befektetés egymás mellett."
            }
          >
            <VizLegend
              items={[
                { key: "profit", label: "Halmozott eredmény", color: VIZ.profit },
                {
                  key: "investment",
                  label: "Halmozott befektetés",
                  color: VIZ.investment,
                  dashed: true,
                },
              ]}
            />
            <CumulativeChart data={cumulative} />
            {paybackNote && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                {lastPoint && lastPoint.net < 0 ? (
                  <IconAlertTriangle className="size-4 text-amber-500" />
                ) : (
                  <IconInfoCircle className="size-4" />
                )}
                {paybackNote}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              {storeId === "all"
                ? "A korábbi évek egyenlege is beleszámít – a metszéspont a megtérülés."
                : "Üzletre szűrve az időszak nyitóegyenlege nulláról indul."}
            </p>
          </Disclosure>

          <Disclosure title="Legjobb és leggyengébb napok">
            <div className="grid gap-4 lg:grid-cols-2">
              <TopDays title="Legerősebb napok" days={topDays.best} />
              <TopDays title="Leggyengébb nyitott napok" days={topDays.worst} />
            </div>
          </Disclosure>
        </>
      )}
    </div>
  );
}

function TopDays({
  title,
  days,
}: {
  title: string;
  days: { key: string; income: number; profit: number; shifts: number }[];
}) {
  const max = days.reduce((acc, d) => Math.max(acc, d.income), 0);
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 grid gap-3">
        {days.map((day) => (
          <li key={day.key} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span>{formatDayFull(day.key)}</span>
              <span className="font-medium tabular-nums">
                {formatHuf(day.income)}
              </span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${max > 0 ? (day.income / max) * 100 : 0}%`,
                  backgroundColor: VIZ.income,
                }}
              />
            </div>
            <div className="text-muted-foreground text-xs">
              Eredmény: {formatHuf(day.profit)} · {day.shifts} műszak
            </div>
          </li>
        ))}
        {days.length === 0 && (
          <li className="text-muted-foreground text-sm">Nincs adat.</li>
        )}
      </ul>
    </section>
  );
}
