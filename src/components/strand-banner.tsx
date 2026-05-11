"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconBeach, IconArrowsExchange } from "@tabler/icons-react";
import { api } from "~/trpc/react";

const STRAND_GRADIENT: Record<string, string> = {
  balatonvilagos: "from-sky-500 via-cyan-400 to-emerald-300",
  tihany: "from-indigo-600 via-violet-500 to-rose-400",
};

export function StrandBanner({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: strands = [] } = api.strand.getAll.useQuery();
  const current = strands.find((s) => s.slug === slug);
  const other = strands.find((s) => s.slug !== slug);
  const gradient = STRAND_GRADIENT[slug] ?? "from-slate-700 via-slate-500 to-slate-300";

  return (
    <div className="px-4 lg:px-6">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
        <div
          className={`absolute -right-12 -top-12 size-44 rounded-full bg-gradient-to-br ${gradient} opacity-30 blur-2xl`}
        />
        <div className="relative flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
            >
              <IconBeach className="size-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Aktív strand
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {current?.name ?? "Strand"}
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {other && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/${other.slug}`)}
                className="group inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted"
              >
                <IconArrowsExchange className="size-4 transition-transform group-hover:rotate-180" />
                Váltás: {other.name}
              </button>
            )}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Strand választó
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
