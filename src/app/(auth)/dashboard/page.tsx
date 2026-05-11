import Link from "next/link";
import { IconBeach, IconArrowRight } from "@tabler/icons-react";
import { getAllStrands } from "~/server/api/services/strand.service";

const STRAND_ART: Record<
  string,
  {
    gradient: string;
    accent: string;
    blurb: string;
  }
> = {
  balatonvilagos: {
    gradient: "from-sky-500 via-cyan-400 to-emerald-300",
    accent: "shadow-cyan-300/60",
    blurb: "A déli part hangulata",
  },
  tihany: {
    gradient: "from-indigo-600 via-violet-500 to-rose-400",
    accent: "shadow-violet-400/60",
    blurb: "A félsziget panorámája",
  },
};

const FALLBACK_ART = {
  gradient: "from-slate-700 via-slate-500 to-slate-300",
  accent: "shadow-slate-400/60",
  blurb: "Strand",
};

export default async function DashboardLandingPage() {
  const strands = await getAllStrands();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(167,139,250,0.25),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(45,212,191,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[120%] -translate-x-1/2 rotate-3 bg-gradient-to-r from-cyan-500/20 via-transparent to-violet-500/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur">
            <IconBeach className="size-4 text-cyan-300" />
            Balaton Admin
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Válassz strandot
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/60 md:text-lg">
            Mindkét strand külön kezeli a boltjait, dolgozóit és pénzügyeit.
            Bármikor visszaválthatsz a bal oldali menüből.
          </p>
        </div>

        <div className="mt-14 grid w-full max-w-5xl gap-6 md:grid-cols-2">
          {strands.map((strand, idx) => {
            const art = STRAND_ART[strand.slug] ?? FALLBACK_ART;
            return (
              <Link
                key={strand.id}
                href={`/dashboard/${strand.slug}`}
                className="group relative block"
                style={{ animationDelay: `${150 + idx * 120}ms` }}
              >
                <div
                  className={`animate-in fade-in slide-in-from-bottom-6 fill-mode-backwards duration-700 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:border-white/30 group-hover:bg-white/10 group-hover:shadow-2xl ${art.accent}`}
                  style={{ animationDelay: `${150 + idx * 120}ms` }}
                >
                  <div
                    className={`absolute -right-16 -top-16 size-60 rounded-full bg-gradient-to-br ${art.gradient} opacity-40 blur-2xl transition-all duration-700 group-hover:scale-125 group-hover:opacity-60`}
                  />
                  <div
                    className={`absolute -left-20 -bottom-24 size-72 rounded-full bg-gradient-to-tr ${art.gradient} opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-40`}
                  />

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${art.gradient} text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
                      >
                        <IconBeach className="size-7" />
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/60">
                        Strand
                      </span>
                    </div>

                    <div className="mt-10">
                      <p className="text-sm uppercase tracking-[0.2em] text-white/40">
                        {art.blurb}
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                        {strand.name}
                      </h2>
                    </div>

                    <div className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-all duration-300 group-hover:gap-4 group-hover:text-white">
                      Belépés a felületre
                      <IconArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
