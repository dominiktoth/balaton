"use client";

import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/**
 * Közös diagram-elemek: paletta-szerepek, jelmagyarázat, tooltip.
 *
 * A színek szerep szerint vannak kiosztva (bevétel / kiadás / bér / eredmény /
 * befektetés) — soha nem sorrend vagy nagyság szerint —, így ugyanaz a tétel
 * minden diagramon ugyanazt a színt kapja. A hex értékek a globals.css-ben
 * élnek `--viz-*` néven, világos és sötét felületre külön léptetve.
 */
export const VIZ = {
  income: "var(--viz-income)",
  expense: "var(--viz-expense)",
  wage: "var(--viz-wage)",
  profit: "var(--viz-profit)",
  investment: "var(--viz-investment)",
  grid: "var(--viz-grid)",
  axis: "var(--viz-axis)",
} as const;

export type SeriesKey = keyof typeof VIZ;

export const SERIES_LABEL: Record<string, string> = {
  income: "Bevétel",
  expense: "Kiadás",
  wage: "Munkabér",
  profit: "Eredmény",
  investment: "Befektetés",
};

export function VizLegend({
  items,
  className,
}: {
  items: { key: string; label: string; color: string; dashed?: boolean }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      {items.map((item) => (
        <span
          key={item.key}
          className="text-muted-foreground flex items-center gap-1.5 text-xs"
        >
          {item.dashed ? (
            <span
              className="h-0 w-3 border-t-2 border-dashed"
              style={{ borderColor: item.color }}
            />
          ) : (
            <span
              className="size-2.5 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
}

export type TooltipRow = {
  key: string;
  label: string;
  value: string;
  color?: string;
  dashed?: boolean;
  strong?: boolean;
};

export function VizTooltip({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle?: string;
  rows: TooltipRow[];
}) {
  return (
    <div className="border-border/60 bg-background grid min-w-[12rem] gap-2 rounded-lg border px-3 py-2 text-xs shadow-xl">
      <div>
        <div className="font-medium">{title}</div>
        {subtitle && (
          <div className="text-muted-foreground text-[11px]">{subtitle}</div>
        )}
      </div>
      <div className="grid gap-1">
        {rows.map((row) => (
          <div
            key={row.key}
            className={cn(
              "flex items-center justify-between gap-6",
              row.strong && "border-border/60 mt-0.5 border-t pt-1",
            )}
          >
            <span className="text-muted-foreground flex items-center gap-1.5">
              {row.color &&
                (row.dashed ? (
                  <span
                    className="h-0 w-2.5 border-t-2 border-dashed"
                    style={{ borderColor: row.color }}
                  />
                ) : (
                  <span
                    className="size-2.5 rounded-[2px]"
                    style={{ backgroundColor: row.color }}
                  />
                ))}
              {row.label}
            </span>
            <span
              className={cn(
                "tabular-nums",
                row.strong ? "font-semibold" : "font-medium",
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Diagram-keret: cím, leírás, opcionális fejléc-akció és jelmagyarázat. */
export function VizFrame({
  title,
  description,
  action,
  legend,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-card text-card-foreground rounded-xl border p-4 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
          )}
        </div>
        {action}
      </div>
      {legend && <div className="mt-3">{legend}</div>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Recharts tooltip payload — csak a ténylegesen használt mezők. */
export type RechartsTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: {
    dataKey?: string | number;
    name?: string | number;
    value?: number;
    color?: string;
    payload?: Record<string, unknown>;
  }[];
};
