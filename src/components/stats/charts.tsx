"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  VIZ,
  VizTooltip,
  type RechartsTooltipProps,
} from "~/components/stats/viz";
import {
  formatDay,
  formatDayFull,
  formatHuf,
  formatPercent,
  formatShort,
  type GroupBucket,
  type GroupMode,
  type ProgressPoint,
  type StoreStat,
} from "~/lib/stats";

const AXIS_TICK = { fontSize: 11, fill: VIZ.axis };
const MONEY_AXIS = (value: number) => `${formatShort(value)} Ft`;

/* ------------------------------------------------------------------ */
/* Bevétel / költség / eredmény trend                                  */
/* ------------------------------------------------------------------ */

function TrendTooltip({ active, payload }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as GroupBucket | undefined;
  if (!point) return null;
  return (
    <VizTooltip
      title={point.label}
      subtitle={point.sublabel || undefined}
      rows={[
        {
          key: "income",
          label: "Bevétel",
          value: formatHuf(point.income),
          color: VIZ.income,
        },
        {
          key: "expense",
          label: "Kiadás",
          value: formatHuf(point.expense),
          color: VIZ.expense,
        },
        {
          key: "wage",
          label: "Munkabér",
          value: formatHuf(point.wage),
          color: VIZ.wage,
        },
        {
          key: "profit",
          label: "Eredmény",
          value: formatHuf(point.profit),
          color: VIZ.profit,
          strong: true,
        },
        {
          key: "meta",
          label: "Nyitott nap / műszak",
          value: `${point.activeDays} / ${point.shifts}`,
        },
      ]}
    />
  );
}

export function TrendChart({
  data,
  mode,
  onSelect,
}: {
  data: GroupBucket[];
  mode: GroupMode;
  onSelect?: (key: string) => void;
}) {
  const hasNegative = data.some((d) => d.profit < 0);
  const showLabels = data.length <= 14;
  const interval = mode === "day" && data.length > 40 ? "preserveStartEnd" : 0;
  // Kevés oszlopnál vastagabb sávok, sok napnál vékonyak — különben
  // három hónap három tűnyi oszlopként lebeg a diagram alján.
  const barSize = data.length <= 6 ? 46 : data.length <= 20 ? 26 : 12;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart
        data={data}
        margin={{ top: 16, right: 8, left: 8, bottom: 0 }}
        barGap={4}
        barCategoryGap="18%"
        onClick={(state: { activeLabel?: string | number }) => {
          const label = state?.activeLabel;
          if (!onSelect || label === undefined) return;
          const match = data.find((d) => d.label === String(label));
          if (match) onSelect(match.key);
        }}
      >
        <CartesianGrid vertical={false} stroke={VIZ.grid} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
          interval={interval}
          tick={AXIS_TICK}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={84}
          tickFormatter={MONEY_AXIS}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={<TrendTooltip />}
        />
        {hasNegative && <ReferenceLine y={0} stroke={VIZ.axis} />}
        <Bar
          dataKey="income"
          name="Bevétel"
          fill={VIZ.income}
          radius={[4, 4, 0, 0]}
          maxBarSize={barSize}
          isAnimationActive={false}
        />
        <Bar
          dataKey="wage"
          name="Munkabér"
          stackId="cost"
          fill={VIZ.wage}
          stroke="var(--card)"
          strokeWidth={1}
          maxBarSize={barSize}
          isAnimationActive={false}
        />
        <Bar
          dataKey="expense"
          name="Kiadás"
          stackId="cost"
          fill={VIZ.expense}
          stroke="var(--card)"
          strokeWidth={1}
          radius={[4, 4, 0, 0]}
          maxBarSize={barSize}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="profit"
          name="Eredmény"
          stroke={VIZ.profit}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        >
          {showLabels && (
            <LabelList
              dataKey="profit"
              position="top"
              offset={10}
              className="fill-foreground"
              fontSize={10}
              formatter={(value: number) => formatShort(value)}
            />
          )}
        </Line>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Szezon állása: idei kumulált görbe a bázis mellett                  */
/* ------------------------------------------------------------------ */

function ProgressTooltip({
  active,
  payload,
  metricLabel,
  baseLabel,
  color,
}: RechartsTooltipProps & {
  metricLabel: string;
  baseLabel: string;
  color?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as ProgressPoint | undefined;
  if (!point) return null;
  const diff = point.previous === null ? null : point.current - point.previous;
  return (
    <VizTooltip
      title={formatDayFull(point.key)}
      subtitle={`Halmozott ${metricLabel.toLowerCase()}`}
      rows={[
        {
          key: "current",
          label: "Idei időszak",
          value: formatHuf(point.current),
          color: color ?? VIZ.income,
        },
        ...(point.previous !== null
          ? [
              {
                key: "previous",
                label: baseLabel,
                value: formatHuf(point.previous),
                color: VIZ.axis,
                dashed: true,
              },
            ]
          : []),
        ...(diff !== null
          ? [
              {
                key: "diff",
                label: diff >= 0 ? "Előny" : "Lemaradás",
                value: formatHuf(Math.abs(diff)),
                strong: true,
              },
            ]
          : []),
      ]}
    />
  );
}

export function SeasonProgressChart({
  data,
  color,
  metricLabel,
  baseLabel,
}: {
  data: ProgressPoint[];
  color: string;
  metricLabel: string;
  baseLabel: string;
}) {
  const hasNegative = data.some(
    (d) => d.current < 0 || (d.previous ?? 0) < 0,
  );
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 16, right: 12, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="viz-progress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={VIZ.grid} />
        <XAxis
          dataKey="key"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={44}
          tick={AXIS_TICK}
          tickFormatter={(value: string) => formatDay(value)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={84}
          tickFormatter={MONEY_AXIS}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={{ stroke: VIZ.axis, strokeDasharray: "4 4" }}
          content={
            <ProgressTooltip
              metricLabel={metricLabel}
              baseLabel={baseLabel}
              color={color}
            />
          }
        />
        {hasNegative && <ReferenceLine y={0} stroke={VIZ.axis} />}
        <Area
          type="monotone"
          dataKey="previous"
          name={baseLabel}
          stroke={VIZ.axis}
          strokeWidth={2}
          strokeDasharray="5 4"
          fill="none"
          connectNulls={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="current"
          name="Idei időszak"
          stroke={color}
          strokeWidth={2.5}
          fill="url(#viz-progress)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Kumulált eredmény vs. befektetés (megtérülés)                       */
/* ------------------------------------------------------------------ */

export type CumulativePoint = {
  key: string;
  profit: number;
  investment: number;
  net: number;
};

function CumulativeTooltip({ active, payload }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as CumulativePoint | undefined;
  if (!point) return null;
  return (
    <VizTooltip
      title={formatDayFull(point.key)}
      rows={[
        {
          key: "profit",
          label: "Halmozott eredmény",
          value: formatHuf(point.profit),
          color: VIZ.profit,
        },
        {
          key: "investment",
          label: "Halmozott befektetés",
          value: formatHuf(point.investment),
          color: VIZ.investment,
          dashed: true,
        },
        {
          key: "net",
          label: point.net >= 0 ? "Megtérült" : "Még hiányzik",
          value: formatHuf(Math.abs(point.net)),
          strong: true,
        },
      ]}
    />
  );
}

export function CumulativeChart({ data }: { data: CumulativePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="viz-cumulative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VIZ.profit} stopOpacity={0.35} />
            <stop offset="100%" stopColor={VIZ.profit} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={VIZ.grid} />
        <XAxis
          dataKey="key"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={40}
          tick={AXIS_TICK}
          tickFormatter={(value: string) => formatDay(value)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={84}
          tickFormatter={MONEY_AXIS}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={{ stroke: VIZ.axis, strokeDasharray: "4 4" }}
          content={<CumulativeTooltip />}
        />
        <ReferenceLine y={0} stroke={VIZ.axis} />
        <Area
          type="monotone"
          dataKey="profit"
          name="Halmozott eredmény"
          stroke={VIZ.profit}
          strokeWidth={2}
          fill="url(#viz-cumulative)"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="investment"
          name="Halmozott befektetés"
          stroke={VIZ.investment}
          strokeWidth={2}
          strokeDasharray="5 4"
          fill="none"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Hét napjai – átlagos nap profilja                                   */
/* ------------------------------------------------------------------ */

function WeekdayTooltip({ active, payload }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as
    | (GroupBucket & { avgProfit: number; index: number })
    | undefined;
  if (!point) return null;
  return (
    <VizTooltip
      title={point.label}
      subtitle={`${point.activeDays} nyitott nap`}
      rows={[
        {
          key: "income",
          label: "Átlagos bevétel",
          value: formatHuf(point.avgIncome),
          color: VIZ.income,
        },
        {
          key: "profit",
          label: "Átlagos eredmény",
          value: formatHuf(point.avgProfit),
          color: VIZ.profit,
        },
        {
          key: "index",
          label: "Az átlaghoz képest",
          value: formatPercent(point.index, 0),
          strong: true,
        },
      ]}
    />
  );
}

export function WeekdayChart({
  data,
  average,
}: {
  data: (GroupBucket & { avgProfit: number; index: number })[];
  average: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={VIZ.grid} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={AXIS_TICK}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={84}
          tickFormatter={MONEY_AXIS}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={<WeekdayTooltip />}
        />
        {average > 0 && (
          <ReferenceLine y={average} stroke={VIZ.axis} strokeDasharray="5 4" />
        )}
        <Bar
          dataKey="avgIncome"
          name="Átlagos bevétel"
          fill={VIZ.income}
          radius={[4, 4, 0, 0]}
          maxBarSize={44}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="avgIncome"
            position="top"
            offset={8}
            className="fill-foreground"
            fontSize={10}
            formatter={(value: number) => formatShort(value)}
          />
        </Bar>
        <Bar
          dataKey="avgProfit"
          name="Átlagos eredmény"
          fill={VIZ.profit}
          radius={[4, 4, 0, 0]}
          maxBarSize={44}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Boltok összehasonlítása                                             */
/* ------------------------------------------------------------------ */

function StoreTooltip({ active, payload }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as StoreStat | undefined;
  if (!point) return null;
  return (
    <VizTooltip
      title={point.name}
      subtitle={`${point.activeDays} nyitott nap · ${point.shifts} műszak`}
      rows={[
        {
          key: "income",
          label: "Bevétel",
          value: formatHuf(point.income),
          color: VIZ.income,
        },
        {
          key: "profit",
          label: "Eredmény",
          value: formatHuf(point.profit),
          color: VIZ.profit,
        },
        {
          key: "margin",
          label: "Árrés",
          value: formatPercent(point.margin),
          strong: true,
        },
      ]}
    />
  );
}

export function StoreChart({ data }: { data: StoreStat[] }) {
  const height = Math.max(180, data.length * 56 + 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
        barGap={2}
      >
        <CartesianGrid horizontal={false} stroke={VIZ.grid} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={MONEY_AXIS}
          tick={AXIS_TICK}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={120}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={<StoreTooltip />}
        />
        <ReferenceLine x={0} stroke={VIZ.axis} />
        <Bar
          dataKey="income"
          name="Bevétel"
          fill={VIZ.income}
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          isAnimationActive={false}
        />
        <Bar
          dataKey="profit"
          name="Eredmény"
          fill={VIZ.profit}
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="profit"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={10}
            formatter={(value: number) => `${formatShort(value)} Ft`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
