"use client";

import type { ReactNode } from "react";
import { IconDownload } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import { toCsv } from "~/lib/stats";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Táblában megjelenő tartalom. */
  render: (row: T) => ReactNode;
  /** CSV-be kerülő nyers érték (alapból a render nem használható). */
  csv?: (row: T) => string | number;
  headClassName?: string;
  cellClassName?: string;
};

/**
 * A diagramok mellé kötelező táblanézet: minden számadat pontosan
 * kiolvasható, és CSV-be exportálható (könyvelés / árajánlat).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  footer,
  csvFileName,
  empty = "Nincs adat a kiválasztott időszakban.",
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  rowClassName?: (row: T) => string | undefined;
  footer?: ReactNode;
  csvFileName?: string;
  empty?: string;
  className?: string;
}) {
  const download = () => {
    const header = columns.map((c) => c.header);
    const body = rows.map((row) =>
      columns.map((c) => (c.csv ? c.csv(row) : "")),
    );
    const csv = toCsv([header, ...body]);
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = csvFileName ?? "statisztika.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      {csvFileName && rows.length > 0 && (
        <div className="mb-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={download}>
            <IconDownload className="size-4" />
            CSV
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap",
                    c.align === "right" && "text-right",
                    c.headClassName,
                  )}
                >
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={rowKey(row, index)} className={rowClassName?.(row)}>
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap",
                      c.align === "right" && "text-right tabular-nums",
                      c.cellClassName,
                    )}
                  >
                    {c.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground py-6 text-center"
                >
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {footer && <TableFooter>{footer}</TableFooter>}
        </Table>
      </div>
    </div>
  );
}
