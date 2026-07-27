"use client";

import type { ReactNode } from "react";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconMinus,
} from "@tabler/icons-react";

import { cn } from "~/lib/utils";
import { formatPercent } from "~/lib/stats";

/** Melyik irány a jó hír: bevételnél a növekedés, kiadásnál a csökkenés. */
export type DeltaDirection = "up-good" | "down-good" | "neutral";

export function StatCard({
  label,
  value,
  hint,
  delta,
  deltaLabel,
  direction = "up-good",
  color,
  className,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  /** Változás %-ban az összehasonlító időszakhoz képest; null = nincs bázis. */
  delta?: number | null;
  deltaLabel?: string;
  direction?: DeltaDirection;
  /** A kártyához tartozó sorozat színe (a diagramokkal egyező). */
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl border p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          {color && (
            <span
              className="size-2.5 rounded-[2px]"
              style={{ backgroundColor: color }}
            />
          )}
          {label}
        </span>
        <DeltaBadge delta={delta} direction={direction} title={deltaLabel} />
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">
        {value}
      </div>
      {hint && (
        <div className="text-muted-foreground mt-1 text-xs">{hint}</div>
      )}
    </div>
  );
}

export function DeltaBadge({
  delta,
  direction = "up-good",
  title,
}: {
  delta?: number | null;
  direction?: DeltaDirection;
  title?: string;
}) {
  if (delta === undefined || delta === null || !Number.isFinite(delta)) {
    return null;
  }

  const flat = Math.abs(delta) < 0.5;
  const good =
    direction === "neutral" || flat
      ? null
      : direction === "up-good"
        ? delta > 0
        : delta < 0;

  const Icon = flat ? IconMinus : delta > 0 ? IconArrowUpRight : IconArrowDownRight;

  return (
    <span
      title={title}
      className={cn(
        "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
        good === null && "bg-muted text-muted-foreground",
        good === true &&
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
        good === false &&
          "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
      )}
    >
      <Icon className="size-3.5" />
      {formatPercent(Math.abs(delta), 0)}
    </span>
  );
}
