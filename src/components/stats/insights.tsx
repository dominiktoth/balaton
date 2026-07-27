"use client";

import type { ReactNode } from "react";
import {
  IconAlertTriangle,
  IconChevronDown,
  IconCircleCheck,
  IconInfoCircle,
  IconTrendingDown,
} from "@tabler/icons-react";

import { cn } from "~/lib/utils";
import type { Insight, InsightTone } from "~/lib/stats";

const TONE: Record<
  InsightTone,
  { icon: typeof IconInfoCircle; className: string; iconClass: string }
> = {
  critical: {
    icon: IconTrendingDown,
    className: "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/40",
    iconClass: "text-rose-600 dark:text-rose-400",
  },
  warning: {
    icon: IconAlertTriangle,
    className:
      "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/40",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  good: {
    icon: IconCircleCheck,
    className:
      "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/40",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  info: {
    icon: IconInfoCircle,
    className: "border-border bg-muted/40",
    iconClass: "text-muted-foreground",
  },
};

/** A számokat helyetted olvassa ki: mi romlott, mi javult, hol áll ki pénz. */
export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <section className="grid gap-3">
      <h2 className="font-semibold">Mire figyelj</h2>
      <ul className="grid gap-2 md:grid-cols-2">
        {insights.map((insight) => {
          const tone = TONE[insight.tone];
          const Icon = tone.icon;
          return (
            <li
              key={insight.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3",
                tone.className,
              )}
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", tone.iconClass)} />
              <div className="min-w-0">
                <div className="text-sm font-medium">{insight.title}</div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {insight.detail}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Kisebb tények egy sorban — nem érdemelnek külön kártyát. */
export function FactRow({
  facts,
}: {
  facts: { label: string; value: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border px-4 py-3">
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-baseline gap-2">
          <span className="text-muted-foreground text-xs">{fact.label}</span>
          <span className="text-sm font-medium tabular-nums">{fact.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Összecsukható szekció a ritkábban nézett részletekhez. */
export function Disclosure({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group bg-card text-card-foreground rounded-xl border shadow-sm"
    >
      <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
          )}
        </div>
        <IconChevronDown className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-6 border-t p-4 sm:p-6">{children}</div>
    </details>
  );
}
