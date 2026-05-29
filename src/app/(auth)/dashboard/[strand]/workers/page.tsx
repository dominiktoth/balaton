"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "~/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { MultiSelectCombobox } from "~/components/ui/multiselect-combobox";

export default function WorkersPage() {
  const params = useParams<{ strand: string }>();
  const strandSlug = params.strand;

  const { data: workers = [], refetch } = api.worker.getWorkers.useQuery({ strandSlug });
  const { data: stores = [] } = api.store.getAllStores.useQuery({ strandSlug });
  const { mutate: createWorker, isPending: isCreating } = api.worker.createWorker.useMutation({
    onSuccess: () => {
      setName("");
      setStoreIds([]);
      void refetch();
    },
  });

  const { mutate: deleteWorker, isPending: isDeleting } = api.worker.deleteWorker.useMutation({
    onSuccess: () => void refetch(),
  });

  const { mutate: updateWorker, isPending: isUpdating } = api.worker.updateWorker.useMutation({
    onSuccess: () => {
      setEditWorker(null);
      void refetch();
    },
  });

  const [name, setName] = useState("");
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [dailyWage, setDailyWage] = useState<string>("");
  const [editWorker, setEditWorker] = useState<null | { id: string; name: string; storeIds: string[]; dailyWage?: number | null }>(null);

  const storeOptions = stores.map((store) => ({ label: store.name, value: store.id }));

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || storeIds.length === 0) return;
    createWorker({ name, storeIds, dailyWage: dailyWage ? parseFloat(dailyWage) : undefined });
  };

  // Munkanapok rögzítése szekcióhoz
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedStore, setSelectedStore] = useState<string>(""); // Explicitly type as string
  const workshiftQueryInput = { storeId: selectedStore, date: selectedDate ?? "" };
  const { data: workshiftsForDate = [], isLoading: isLoadingWorkshifts } = api.workshift.getWorkShiftsByStoreAndDate.useQuery(
    workshiftQueryInput,
    { enabled: !!selectedDate }
  );
  const utils = api.useUtils();

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
      };
      utils.workshift.getWorkShiftsByStoreAndDate.setData(
        workshiftQueryInput,
        (old) => [...(old ?? []), optimistic as unknown as NonNullable<typeof old>[number]],
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

  const { mutate: upsertWageForWorkshift } = api.worker.upsertWageForWorkshift.useMutation({
    onSettled: () => {
      void utils.workshift.getWorkShiftsByStoreAndDate.invalidate(workshiftQueryInput);
      void utils.worker.getAllWages.invalidate();
    },
  });

  // Per-worker draft inputs for the daily amount. When undefined, falls back to
  // the existing wage / worker.dailyWage / empty.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    // Reset drafts when the date or store filter changes, so the inputs reflect
    // the fresh server data for that day.
    setDrafts({});
  }, [selectedDate, selectedStore]);

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

  return (
    <div className="max-w-xl mx-auto py-10 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-6">Dolgozók kezelése</h1>
      <form onSubmit={handleAddWorker} className="flex gap-2 mb-8 items-center">
        <div className="flex-1">
          <Label htmlFor="worker-name " className="mb-2">Név</Label>
          <Input
            id="worker-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Új dolgozó neve"
            required
          />
        </div>
        <div className="flex-1">
          <MultiSelectCombobox
            options={storeOptions}
            value={storeIds}
            onChange={setStoreIds}
            label="Üzletek"
            placeholder="Válassz üzlet(ek)et"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="worker-dailywage" className="mb-2">Napi bér (Ft)</Label>
          <Input
            id="worker-dailywage"
            type="number"
            min="0"
            value={dailyWage}
            onChange={e => setDailyWage(e.target.value)}
            placeholder="Pl. 20000"
          />
        </div>
        <Button type="submit" disabled={isCreating} className="self-end">
          {isCreating ? "Hozzáadás..." : "Hozzáadás"}
        </Button>
      </form>
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Név</TableHead>
              <TableHead>Üzletek</TableHead>
              <TableHead>Napi bér</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => {
              type Store = { id: string; name: string };
              return (
                <TableRow key={worker.id}>
                  <TableCell>{worker.name}</TableCell>
                  <TableCell>{worker.stores?.map((s: Store) => s.name).join(", ") || "-"}</TableCell>
                  <TableCell>{worker.dailyWage ? `Ft ${worker.dailyWage.toLocaleString()}` : "-"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditWorker({ id: worker.id, name: worker.name, storeIds: worker.stores?.map((s: Store) => s.id) || [], dailyWage: worker.dailyWage })}
                    >
                      Szerkesztés
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => deleteWorker({ id: worker.id })}
                    >
                      {isDeleting ? "Törlés..." : "Törlés"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {workers.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground text-center">Nincsenek Dolgozók.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Szerkesztő dialog */}
      <Dialog open={!!editWorker} onOpenChange={(open) => !open && setEditWorker(null)}>
        <DialogContent>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!editWorker) return;
              updateWorker({ ...editWorker, dailyWage: editWorker.dailyWage !== undefined && editWorker.dailyWage !== null ? Number(editWorker.dailyWage) : undefined });
            }}
          >
            <DialogHeader>
              <DialogTitle>Dolgozó szerkesztése</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-worker-name">Név</Label>
                <Input
                  id="edit-worker-name"
                  value={editWorker?.name || ""}
                  onChange={e => setEditWorker(w => w ? { ...w, name: e.target.value } : w)}
                  required
                />
              </div>
              <div>
                <MultiSelectCombobox
                  options={storeOptions}
                  value={editWorker?.storeIds || []}
                  onChange={vals => setEditWorker(w => w ? { ...w, storeIds: vals } : w)}
                  label="Üzletek"
                  placeholder="Válassz üzlet(ek)et"
                />
              </div>
              <div>
                <Label htmlFor="edit-worker-dailywage">Napi bér (Ft)</Label>
                <Input
                  id="edit-worker-dailywage"
                  type="number"
                  min="0"
                  value={editWorker?.dailyWage ?? ""}
                  onChange={e => setEditWorker(w => w ? { ...w, dailyWage: e.target.value === "" ? undefined : Number(e.target.value) } : w)}
                  placeholder="Pl. 20000"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Mentés..." : "Mentés"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditWorker(null)}>
                Mégse
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Munkanapok rögzítése szekció */}
      <div className="mb-10 p-4 border rounded bg-muted/30">
        <h2 className="text-xl font-semibold mb-4">Munkanapok rögzítése</h2>
        <div className="flex gap-4 mb-4 items-end">
          <div>
            <Label htmlFor="workshift-date">Dátum</Label>
            <Input
              id="workshift-date"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <Label htmlFor="workshift-store">Üzlet</Label>
            <select
              id="workshift-store"
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Összes</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto border rounded bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Napi bér (Ft)</TableHead>
                <TableHead>Művelet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => {
                const workerStores = worker.stores ?? [];
                if (selectedStore && !workerStores.some((s: { id: string; name: string }) => s.id === selectedStore)) return null;
                const workshift = workshiftsForDate.find((ws) => ws.workerId === worker.id);
                const wageOnShift = workshift?.wage;
                const firstStoreId = workerStores.length > 0 && workerStores[0] ? workerStores[0].id : "";
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
                const hasValidNumber = parsed !== null && !Number.isNaN(parsed) && parsed >= 0;
                const isDirty = persisted == null
                  ? hasValidNumber
                  : hasValidNumber && parsed !== persisted;

                const handleSave = () => {
                  if (!hasValidNumber || parsed === null) return;
                  if (workshift) {
                    upsertWageForWorkshift({
                      workShiftId: workshift.id,
                      workerId: worker.id,
                      amount: parsed,
                      date: selectedDate ?? "",
                    });
                  } else {
                    createWorkShift({
                      workerId: worker.id,
                      storeId: selectedStore || firstStoreId || "",
                      date: selectedDate ?? "",
                      amount: parsed,
                    });
                  }
                  setDrafts((d) => {
                    const { [worker.id]: _, ...rest } = d;
                    return rest;
                  });
                };

                return (
                  <TableRow key={worker.id} className={workshift ? "bg-emerald-50/40" : ""}>
                    <TableCell className="font-medium">
                      {worker.name}
                      {workshift && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-700">
                          rögzítve
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={inputValue}
                        placeholder={worker.dailyWage ? String(worker.dailyWage) : "0"}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [worker.id]: e.target.value }))
                        }
                        disabled={isLoadingWorkshifts}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={!hasValidNumber || !isDirty}
                        >
                          {workshift ? "Frissítés" : "Mentés"}
                        </Button>
                        {workshift && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteWorkShift({ id: workshift.id })}
                          >
                            Törlés
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {workers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-center">Nincsenek Dolgozók.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 