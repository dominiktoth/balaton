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
        setPayoutWorker(null);
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
  const { mutate: deleteWorker } = api.worker.deleteWorker.useMutation({
    onSuccess: () => {
      setWorkerToDelete(null);
      void refetchWorkers();
    },
  });

  const storeOptions = stores.map((s) => ({ label: s.name, value: s.id }));

  const visibleWorkers = workers.filter(
    (w) => !selectedStore || w.stores?.some((s) => s.id === selectedStore),
  );

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
          const isDirty =
            persisted == null
              ? hasValid
              : hasValid && parsed !== persisted;

          // Per-worker totals (across all dates)
          const myWages = allWages.filter((w) => w.workerId === worker.id);
          const pendingWages = myWages.filter((w) => !w.paid);
          const pendingTotal = pendingWages.reduce((s, w) => s + w.amount, 0);
          const paidTotal = myWages
            .filter((w) => w.paid)
            .reduce((s, w) => s + w.amount, 0);

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
            if (todaysWorkshift) {
              upsertWageForWorkshift({
                workShiftId: todaysWorkshift.id,
                workerId: worker.id,
                amount: parsed,
                date: selectedDate,
              });
            } else {
              createWorkShift({
                workerId: worker.id,
                storeId: selectedStore || firstStoreId,
                date: selectedDate,
                amount: parsed,
              });
            }
            setDrafts((d) => {
              const next = { ...d };
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
                <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
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
                      <span className="ml-auto text-xs font-medium text-emerald-700">
                        ✓ rögzítve
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
              </div>

              {/* Status + payout */}
              <div className="flex flex-wrap items-center gap-4 border-t bg-gradient-to-br from-amber-50/40 via-transparent to-emerald-50/40 px-5 py-4">
                <div className="grid flex-1 grid-cols-[auto_auto] gap-x-6 gap-y-1">
                  <div className="text-xs text-muted-foreground">Függőben</div>
                  <div className="text-lg font-bold text-amber-700">
                    {pendingTotal.toLocaleString()} Ft
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({pendingWages.length} nap)
                    </span>
                  </div>
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
                        return (
                          <tr
                            key={w.id}
                            className={`border-t ${w.paid ? "bg-emerald-50/60" : ""}`}
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
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                                  w.paid
                                    ? "border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                }`}
                                title={
                                  w.paidAt
                                    ? `Kifizetve: ${new Date(w.paidAt).toLocaleString()}`
                                    : "Nincs kifizetve"
                                }
                              >
                                {w.paid ? (
                                  <IconCheck className="size-3.5" />
                                ) : (
                                  <IconX className="size-3.5" />
                                )}
                                {w.paid ? "Kifizetve" : "Függőben"}
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
        onOpenChange={(open) => !open && setWorkerToDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dolgozó törlése</DialogTitle>
            <DialogDescription>
              Biztos törlöd <b>{workerToDelete?.name}</b>-t? Ez törli a
              hozzá tartozó műszakokat is.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setWorkerToDelete(null)}
            >
              Mégse
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                workerToDelete && deleteWorker({ id: workerToDelete.id })
              }
            >
              Törlés
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
                payAllPending({ workerId: payoutWorker.workerId });
              }}
            >
              {isPayingOut ? "..." : "Kifizetés"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
