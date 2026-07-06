"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { MultiSelectCombobox } from "~/components/ui/multiselect-combobox";
import {
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconX,
  IconPlus,
} from "@tabler/icons-react";

function todayStr() {
  return new Date().toISOString().split("T")[0] ?? "";
}
function defaultSeasonStart() {
  return `${new Date().getFullYear()}-05-01`;
}

export default function WorkersPage() {
  const params = useParams<{ strand: string }>();
  const strandSlug = params.strand;

  const utils = api.useUtils();
  const { data: workers = [], refetch: refetchWorkers } =
    api.worker.getWorkers.useQuery({ strandSlug });
  const { data: stores = [] } = api.store.getAllStores.useQuery({ strandSlug });
  const { data: allWages = [] } = api.worker.getAllWages.useQuery({ strandSlug });

  // Top filters
  const [selectedDate, setSelectedDate] = useState<string>(() => todayStr());
  const [selectedStore, setSelectedStore] = useState<string>("");

  const workshiftQueryInput = { storeId: selectedStore, date: selectedDate };
  const { data: workshiftsForDate = [] } =
    api.workshift.getWorkShiftsByStoreAndDate.useQuery(workshiftQueryInput, {
      enabled: !!selectedDate,
    });

  // Per-worker UI state
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailRange, setDetailRange] = useState<
    Record<string, { from: string; to: string }>
  >({});
  const [payoutWorker, setPayoutWorker] = useState<
    | null
    | { workerId: string; total: number; count: number }
  >(null);

  useEffect(() => {
    setDrafts({});
    setNoteDrafts({});
  }, [selectedDate, selectedStore]);

  // Mutations — workshift create/delete with optimistic cache update on today
  const { mutate: createWorkShift } = api.workshift.createWorkShift.useMutation({
    onMutate: async (vars) => {
      await utils.workshift.getWorkShiftsByStoreAndDate.cancel(workshiftQueryInput);
      const prev = utils.workshift.getWorkShiftsByStoreAndDate.getData(workshiftQueryInput);
      const optimistic = {
        id: `optimistic-${vars.workerId}-${Date.now()}`,
        workerId: vars.workerId,
        storeId: vars.storeId,
        date: new Date(vars.date),
        note: vars.note ?? null,
        wageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        worker: workers.find((w) => w.id === vars.workerId) ?? null,
        wage: vars.amount
          ? {
              id: "optimistic-wage",
              workerId: vars.workerId,
              workShiftId: "",
              amount: vars.amount,
              date: new Date(vars.date),
              paid: false,
              paidAt: null,
              paidAmount: 0,
              advanceConsumed: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          : null,
      };
      utils.workshift.getWorkShiftsByStoreAndDate.setData(
        workshiftQueryInput,
        (old) => [
          ...(old ?? []),
          optimistic as unknown as NonNullable<typeof old>[number],
        ],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        utils.workshift.getWorkShiftsByStoreAndDate.setData(workshiftQueryInput, ctx.prev);
      }
    },
    onSettled: () => {
      void utils.workshift.getWorkShiftsByStoreAndDate.invalidate(workshiftQueryInput);
      void utils.worker.getAllWages.invalidate();
    },
  });

  const { mutate: deleteWorkShift } = api.workshift.deleteWorkShift.useMutation({
    onMutate: async (vars) => {
      await utils.workshift.getWorkShiftsByStoreAndDate.cancel(workshiftQueryInput);
      const prev = utils.workshift.getWorkShiftsByStoreAndDate.getData(workshiftQueryInput);
      utils.workshift.getWorkShiftsByStoreAndDate.setData(
        workshiftQueryInput,
        (old) => (old ?? []).filter((ws) => ws.id !== vars.id),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        utils.workshift.getWorkShiftsByStoreAndDate.setData(workshiftQueryInput, ctx.prev);
      }
    },
    onSettled: () => {
      void utils.workshift.getWorkShiftsByStoreAndDate.invalidate(workshiftQueryInput);
      void utils.worker.getAllWages.invalidate();
    },
  });

  const { mutate: upsertWageForWorkshift } =
    api.worker.upsertWageForWorkshift.useMutation({
      onSettled: () => {
        void utils.workshift.getWorkShiftsByStoreAndDate.invalidate(workshiftQueryInput);
        void utils.worker.getAllWages.invalidate();
      },
    });

  const { mutate: setWagePaid } = api.worker.setWagePaid.useMutation({
    onSettled: () => {
      void utils.worker.getAllWages.invalidate();
    },
  });

  const { mutate: payAllPending, isPending: isPayingOut } =
    api.worker.payAllPending.useMutation({
      onSuccess: () => {
        void utils.worker.getAllWages.invalidate();
        void utils.workshift.getWorkShiftsByStoreAndDate.invalidate(workshiftQueryInput);
        setPayoutWorker(null);
      },
    });

  // Advance (előleg) dialog state + mutations
  const [advanceWorker, setAdvanceWorker] = useState<
    | null
    | { workerId: string; name: string }
  >(null);
  const [advAmount, setAdvAmount] = useState("");
  const [advDate, setAdvDate] = useState<string>(() => todayStr());
  const [advNote, setAdvNote] = useState("");
  const { mutate: createAdvance, isPending: isCreatingAdvance } =
    api.worker.createAdvance.useMutation({
      onSuccess: () => {
        setAdvanceWorker(null);
        setAdvAmount("");
        setAdvDate(todayStr());
        setAdvNote("");
        void refetchWorkers();
        void utils.worker.getAllWages.invalidate();
        void utils.workshift.getWorkShiftsByStoreAndDate.invalidate(workshiftQueryInput);
      },
    });
  const { mutate: deleteAdvance } = api.worker.deleteAdvance.useMutation({
    onSuccess: () => {
      void refetchWorkers();
    },
  });

  // Worker CRUD dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addStoreIds, setAddStoreIds] = useState<string[]>([]);
  const [addDailyWage, setAddDailyWage] = useState("");
  const { mutate: createWorker, isPending: isCreatingWorker } =
    api.worker.createWorker.useMutation({
      onSuccess: () => {
        setAddOpen(false);
        setAddName("");
        setAddStoreIds([]);
        setAddDailyWage("");
        void refetchWorkers();
      },
    });

  const [editWorker, setEditWorker] = useState<
    | null
    | { id: string; name: string; storeIds: string[]; dailyWage?: number | null }
  >(null);
  const { mutate: updateWorker, isPending: isUpdatingWorker } =
    api.worker.updateWorker.useMutation({
      onSuccess: () => {
        setEditWorker(null);
        void refetchWorkers();
      },
    });
  const [workerToDelete, setWorkerToDelete] = useState<
    | null
    | { id: string; name: string }
  >(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { mutate: deleteWorker, isPending: isDeletingWorker } =
    api.worker.deleteWorker.useMutation({
      onSuccess: () => {
        setWorkerToDelete(null);
        setDeleteError(null);
        void refetchWorkers();
        void utils.worker.getAllWages.invalidate();
        void utils.workshift.getWorkShiftsByStoreAndDate.invalidate(workshiftQueryInput);
      },
      onError: (err) => {
        setDeleteError(err.message || "Ismeretlen hiba a törléskor.");
      },
    });

  const storeOptions = stores.map((s) => ({ label: s.name, value: s.id }));

  const visibleWorkers = workers.filter(
    (w) => !selectedStore || w.stores?.some((s) => s.id === selectedStore),
  );

  // "Függőben" only counts the current season (May 1 of this year onward)
  const seasonStart = defaultSeasonStart();
  const seasonStartMs = new Date(seasonStart).getTime();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dolgozók</h1>
          <p className="text-sm text-muted-foreground">
            Napi bér rögzítése és kifizetés egy helyen.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="header-date">Nap</Label>
            <Input
              id="header-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div>
            <Label htmlFor="header-store">Üzlet</Label>
            <select
              id="header-store"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-44 rounded border bg-background px-3 py-2"
            >
              <option value="">Összes</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <IconPlus className="mr-1 size-4" /> Új dolgozó
          </Button>
        </div>
      </div>

      {/* Worker cards */}
      <div className="space-y-4">
        {visibleWorkers.map((worker) => {
          const workerStores = worker.stores ?? [];
          const todaysWorkshift = workshiftsForDate.find(
            (ws) => ws.workerId === worker.id,
          );
          const wageOnShift = todaysWorkshift?.wage;
          const firstStoreId = workerStores[0]?.id ?? "";

          const draft = drafts[worker.id];
          const inputValue =
            draft !== undefined
              ? draft
              : wageOnShift?.amount != null
                ? String(wageOnShift.amount)
                : worker.dailyWage != null
                  ? String(worker.dailyWage)
                  : "";
          const persisted = wageOnShift?.amount;
          const parsed = inputValue.trim() === "" ? null : Number(inputValue);
          const hasValid = parsed !== null && !Number.isNaN(parsed) && parsed >= 0;

          const noteDraft = noteDrafts[worker.id];
          const persistedNote = todaysWorkshift?.note ?? "";
          const noteValue = noteDraft !== undefined ? noteDraft : persistedNote;
          const amountDirty =
            persisted == null
              ? hasValid
              : hasValid && parsed !== persisted;
          const noteDirty = noteValue !== persistedNote;
          const isDirty = amountDirty || noteDirty;

          // Per-worker totals — Függőben is current-season-only (May 1
          // of the current year onward); "Eddig kifizetve" stays all-time.
          // With partial payments, pending is the uncovered slice of each wage.
          const myWages = allWages.filter((w) => w.workerId === worker.id);
          const pendingWages = myWages.filter(
            (w) =>
              w.paidAmount < w.amount &&
              new Date(w.date).getTime() >= seasonStartMs,
          );
          const pendingTotal = pendingWages.reduce(
            (s, w) => s + (w.amount - w.paidAmount),
            0,
          );
          const paidTotal = myWages.reduce((s, w) => s + w.paidAmount, 0);
          const advances = worker.advances ?? [];
          const advanceBalance = advances.reduce(
            (s, a) => s + (a.amount - a.used),
            0,
          );

          const isExpanded = !!expanded[worker.id];
          const range =
            detailRange[worker.id] ?? { from: defaultSeasonStart(), to: "" };
          const fromMs = range.from ? new Date(range.from).getTime() : null;
          const toMs = range.to
            ? new Date(range.to).getTime() + 86_400_000 - 1
            : null;
          const detailsWages = myWages
            .filter((w) => {
              const t = new Date(w.date).getTime();
              if (fromMs !== null && t < fromMs) return false;
              if (toMs !== null && t > toMs) return false;
              return true;
            })
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );

          const handleSave = () => {
            if (!hasValid || parsed === null) return;
            const trimmedNote = noteValue.trim();
            if (todaysWorkshift) {
              upsertWageForWorkshift({
                workShiftId: todaysWorkshift.id,
                workerId: worker.id,
                amount: parsed,
                date: selectedDate,
                note: trimmedNote,
              });
            } else {
              createWorkShift({
                workerId: worker.id,
                storeId: selectedStore || firstStoreId,
                date: selectedDate,
                amount: parsed,
                note: trimmedNote || undefined,
              });
            }
            setDrafts((d) => {
              const next = { ...d };
              delete next[worker.id];
              return next;
            });
            setNoteDrafts((n) => {
              const next = { ...n };
              delete next[worker.id];
              return next;
            });
          };

          return (
            <div
              key={worker.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
                <div>
                  <h2 className="text-xl font-bold">{worker.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {workerStores.map((s) => s.name).join(", ") || "—"}
                    {worker.dailyWage
                      ? ` · napi alap: ${worker.dailyWage.toLocaleString()} Ft`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditWorker({
                        id: worker.id,
                        name: worker.name,
                        storeIds: workerStores.map((s) => s.id),
                        dailyWage: worker.dailyWage,
                      })
                    }
                  >
                    Szerkeszt
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setWorkerToDelete({ id: worker.id, name: worker.name })
                    }
                  >
                    Törlés
                  </Button>
                </div>
              </div>

              {/* Today's row */}
              <div className="px-5 py-4">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium">Ma ({selectedDate}):</span>
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={inputValue}
                      placeholder={
                        worker.dailyWage ? String(worker.dailyWage) : "0"
                      }
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [worker.id]: e.target.value }))
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">Ft</span>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasValid || !isDirty}
                    >
                      {todaysWorkshift ? "Frissítés" : "Mentés"}
                    </Button>
                    {todaysWorkshift && (
                      <>
                        <span
                          className={`ml-auto text-xs font-medium ${
                            wageOnShift?.paid && wageOnShift.advanceConsumed > 0
                              ? "text-sky-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {wageOnShift?.paid && wageOnShift.advanceConsumed > 0
                            ? "✓ előlegből fizetve"
                            : "✓ rögzítve"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteWorkShift({ id: todaysWorkshift.id })}
                        >
                          Törlés
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="text"
                      value={noteValue}
                      placeholder="Megjegyzés (opcionális) — pl. csak fél nap, bónusz, stb."
                      onChange={(e) =>
                        setNoteDrafts((n) => ({ ...n, [worker.id]: e.target.value }))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Status + payout */}
              <div className="flex flex-wrap items-center gap-4 border-t bg-gradient-to-br from-amber-50/40 via-transparent to-emerald-50/40 px-5 py-4">
                <div className="grid flex-1 grid-cols-[auto_auto] gap-x-6 gap-y-1">
                  <div className="text-xs text-muted-foreground">
                    Függőben{" "}
                    <span className="text-[10px] uppercase tracking-wider">
                      ({new Date().getFullYear()})
                    </span>
                  </div>
                  <div className="text-lg font-bold text-amber-700">
                    {pendingTotal.toLocaleString()} Ft
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({pendingWages.length} nap)
                    </span>
                  </div>
                  {advanceBalance > 0 && (
                    <>
                      <div className="text-xs text-muted-foreground">
                        Előleg egyenleg
                      </div>
                      <div className="text-sm font-semibold text-sky-700">
                        {advanceBalance.toLocaleString()} Ft
                      </div>
                    </>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Eddig kifizetve
                  </div>
                  <div className="text-sm text-emerald-700">
                    {paidTotal.toLocaleString()} Ft
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {pendingTotal > 0 && (
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() =>
                        setPayoutWorker({
                          workerId: worker.id,
                          total: pendingTotal,
                          count: pendingWages.length,
                        })
                      }
                    >
                      Kifizetés · {pendingTotal.toLocaleString()} Ft
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-sky-300 text-sky-700 hover:bg-sky-50"
                    onClick={() =>
                      setAdvanceWorker({ workerId: worker.id, name: worker.name })
                    }
                  >
                    Előleg
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setExpanded((e) => ({
                        ...e,
                        [worker.id]: !e[worker.id],
                      }))
                    }
                  >
                    Részletek
                    {isExpanded ? (
                      <IconChevronUp className="ml-1 size-4" />
                    ) : (
                      <IconChevronDown className="ml-1 size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t bg-muted/20 px-5 py-4">
                  {advances.length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-sm font-semibold text-sky-800">
                        Előlegek
                      </h3>
                      <table className="w-full rounded border bg-background">
                        <thead>
                          <tr className="bg-sky-50">
                            <th className="p-2 text-left">Dátum</th>
                            <th className="p-2 text-left">Összeg</th>
                            <th className="p-2 text-left">Ledolgozva</th>
                            <th className="p-2 text-left">Maradék</th>
                            <th className="p-2 text-left">Megjegyzés</th>
                            <th className="p-2 text-left"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {advances.map((a) => (
                            <tr key={a.id} className="border-t">
                              <td className="p-2">
                                {new Date(a.date).toLocaleDateString()}
                              </td>
                              <td className="p-2">
                                {a.amount.toLocaleString()} Ft
                              </td>
                              <td className="p-2">
                                {a.used.toLocaleString()} Ft
                              </td>
                              <td className="p-2 font-semibold text-sky-700">
                                {(a.amount - a.used).toLocaleString()} Ft
                              </td>
                              <td className="p-2">{a.note ?? "-"}</td>
                              <td className="p-2 text-right">
                                {a.used === 0 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => deleteAdvance({ id: a.id })}
                                  >
                                    Törlés
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="mb-3 flex flex-wrap items-end gap-3">
                    <div>
                      <Label htmlFor={`from-${worker.id}`}>Tól</Label>
                      <Input
                        id={`from-${worker.id}`}
                        type="date"
                        value={range.from}
                        onChange={(e) =>
                          setDetailRange((r) => ({
                            ...r,
                            [worker.id]: { ...range, from: e.target.value },
                          }))
                        }
                        className="w-40"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`to-${worker.id}`}>Ig</Label>
                      <Input
                        id={`to-${worker.id}`}
                        type="date"
                        value={range.to}
                        onChange={(e) =>
                          setDetailRange((r) => ({
                            ...r,
                            [worker.id]: { ...range, to: e.target.value },
                          }))
                        }
                        className="w-40"
                      />
                    </div>
                  </div>
                  <table className="w-full rounded border bg-background">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left">Dátum</th>
                        <th className="p-2 text-left">Üzlet</th>
                        <th className="p-2 text-left">Összeg</th>
                        <th className="p-2 text-left">Megjegyzés</th>
                        <th className="p-2 text-left">Státusz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsWages.map((w) => {
                        const storeId = w.workShift?.storeId;
                        const storeName = storeId
                          ? (stores.find((s) => s.id === storeId)?.name ?? "-")
                          : "-";
                        const fromAdvance = w.paid && w.advanceConsumed > 0;
                        const partial = !w.paid && w.paidAmount > 0;
                        const chipClass = fromAdvance
                          ? "border-sky-300 bg-sky-100 text-sky-700 hover:bg-sky-200"
                          : w.paid
                            ? "border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100";
                        const chipLabel = fromAdvance
                          ? "Előlegből"
                          : w.paid
                            ? "Kifizetve"
                            : partial
                              ? `Részben (${w.paidAmount.toLocaleString()}/${w.amount.toLocaleString()})`
                              : "Függőben";
                        return (
                          <tr
                            key={w.id}
                            className={`border-t ${
                              fromAdvance
                                ? "bg-sky-50/60"
                                : w.paid
                                  ? "bg-emerald-50/60"
                                  : ""
                            }`}
                          >
                            <td className="p-2">
                              {new Date(w.date).toLocaleDateString()}
                            </td>
                            <td className="p-2">{storeName}</td>
                            <td className="p-2">
                              {w.amount.toLocaleString()} Ft
                            </td>
                            <td className="p-2">{w.workShift?.note ?? "-"}</td>
                            <td className="p-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setWagePaid({ id: w.id, paid: !w.paid })
                                }
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${chipClass}`}
                                title={
                                  w.paidAt
                                    ? `Kifizetve: ${new Date(w.paidAt).toLocaleString()}${w.advanceConsumed > 0 ? ` · ebből előlegből: ${w.advanceConsumed.toLocaleString()} Ft` : ""}`
                                    : partial
                                      ? `Részben fedezve: ${w.paidAmount.toLocaleString()} / ${w.amount.toLocaleString()} Ft`
                                      : "Nincs kifizetve"
                                }
                              >
                                {w.paid ? (
                                  <IconCheck className="size-3.5" />
                                ) : (
                                  <IconX className="size-3.5" />
                                )}
                                {chipLabel}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {detailsWages.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-3 text-center text-muted-foreground"
                          >
                            Nincs adat ebben az időszakban.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {visibleWorkers.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            Nincs dolgozó ezzel a szűrővel.
          </p>
        )}
      </div>

      {/* Add Worker Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Új dolgozó</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!addName || addStoreIds.length === 0) return;
              createWorker({
                name: addName,
                storeIds: addStoreIds,
                dailyWage: addDailyWage ? parseFloat(addDailyWage) : undefined,
              });
            }}
            className="mt-2 space-y-4"
          >
            <div>
              <Label>Név</Label>
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
              />
            </div>
            <div>
              <MultiSelectCombobox
                options={storeOptions}
                value={addStoreIds}
                onChange={setAddStoreIds}
                label="Üzletek"
                placeholder="Válassz üzlet(ek)et"
              />
            </div>
            <div>
              <Label>Napi alapbér (Ft) (opcionális)</Label>
              <Input
                type="number"
                min="0"
                value={addDailyWage}
                onChange={(e) => setAddDailyWage(e.target.value)}
                placeholder="Pl. 20000"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreatingWorker}>
                {isCreatingWorker ? "..." : "Hozzáadás"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Worker Dialog */}
      <Dialog
        open={!!editWorker}
        onOpenChange={(open) => !open && setEditWorker(null)}
      >
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editWorker) return;
              updateWorker({
                ...editWorker,
                dailyWage:
                  editWorker.dailyWage != null
                    ? Number(editWorker.dailyWage)
                    : undefined,
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Dolgozó szerkesztése</DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-4">
              <div>
                <Label>Név</Label>
                <Input
                  value={editWorker?.name ?? ""}
                  onChange={(e) =>
                    setEditWorker((w) =>
                      w ? { ...w, name: e.target.value } : w,
                    )
                  }
                  required
                />
              </div>
              <div>
                <MultiSelectCombobox
                  options={storeOptions}
                  value={editWorker?.storeIds ?? []}
                  onChange={(vals) =>
                    setEditWorker((w) => (w ? { ...w, storeIds: vals } : w))
                  }
                  label="Üzletek"
                  placeholder="Válassz üzlet(ek)et"
                />
              </div>
              <div>
                <Label>Napi alapbér (Ft)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editWorker?.dailyWage ?? ""}
                  onChange={(e) =>
                    setEditWorker((w) =>
                      w
                        ? {
                            ...w,
                            dailyWage:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                          }
                        : w,
                    )
                  }
                  placeholder="Pl. 20000"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isUpdatingWorker}>
                {isUpdatingWorker ? "..." : "Mentés"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditWorker(null)}
              >
                Mégse
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete worker confirm */}
      <Dialog
        open={!!workerToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setWorkerToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dolgozó törlése</DialogTitle>
            <DialogDescription>
              Biztos törlöd <b>{workerToDelete?.name}</b>-t? Ez törli a hozzá
              tartozó műszakokat és béreket is.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setWorkerToDelete(null);
                setDeleteError(null);
              }}
            >
              Mégse
            </Button>
            <Button
              variant="destructive"
              disabled={isDeletingWorker}
              onClick={() => {
                if (!workerToDelete) return;
                setDeleteError(null);
                deleteWorker({ id: workerToDelete.id });
              }}
            >
              {isDeletingWorker ? "Törlés..." : "Törlés"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Confirmation Dialog */}
      <Dialog
        open={!!payoutWorker}
        onOpenChange={(open) => !open && setPayoutWorker(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bér kifizetése</DialogTitle>
            <DialogDescription>
              {payoutWorker && (
                <>
                  Biztos kifizeted{" "}
                  <b>
                    {workers.find((w) => w.id === payoutWorker.workerId)?.name}
                  </b>{" "}
                  összes függő bérét?
                  <br />
                  <span className="mt-2 inline-block font-semibold">
                    {payoutWorker.count} tétel ·{" "}
                    {payoutWorker.total.toLocaleString()} Ft
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPayoutWorker(null)}>
              Mégse
            </Button>
            <Button
              disabled={isPayingOut}
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (!payoutWorker) return;
                payAllPending({
                  workerId: payoutWorker.workerId,
                  dateFrom: seasonStart,
                });
              }}
            >
              {isPayingOut ? "..." : "Kifizetés"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advance (Előleg) Dialog */}
      <Dialog
        open={!!advanceWorker}
        onOpenChange={(open) => !open && setAdvanceWorker(null)}
      >
        <DialogContent className="max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!advanceWorker) return;
              const amount = parseFloat(advAmount);
              if (Number.isNaN(amount) || amount <= 0) return;
              createAdvance({
                workerId: advanceWorker.workerId,
                amount,
                date: advDate,
                note: advNote.trim() || undefined,
                dateFrom: seasonStart,
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Előleg — {advanceWorker?.name}</DialogTitle>
              <DialogDescription>
                Az összeg először a függőben lévő napokat fizeti ki, a maradék
                előlegként a következő ledolgozott napokat fedezi automatikusan,
                amíg el nem fogy.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="adv-amount">Összeg (Ft)</Label>
                <Input
                  id="adv-amount"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  placeholder="Pl. 200000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adv-date">Dátum</Label>
                <Input
                  id="adv-date"
                  type="date"
                  value={advDate}
                  onChange={(e) => setAdvDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="adv-note">Megjegyzés (opcionális)</Label>
                <Input
                  id="adv-note"
                  type="text"
                  value={advNote}
                  onChange={(e) => setAdvNote(e.target.value)}
                  placeholder="Pl. heti előleg"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAdvanceWorker(null)}
              >
                Mégse
              </Button>
              <Button
                type="submit"
                disabled={isCreatingAdvance}
                className="bg-sky-600 hover:bg-sky-700"
              >
                {isCreatingAdvance ? "Mentés..." : "Előleg rögzítése"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
