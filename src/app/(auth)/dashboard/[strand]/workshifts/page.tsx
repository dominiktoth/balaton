"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { IconCheck, IconX } from "@tabler/icons-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";

function defaultSeasonStart() {
  const y = new Date().getFullYear();
  return `${y}-05-01`;
}

export default function WorkshiftsPage() {
  const params = useParams<{ strand: string }>();
  const strandSlug = params.strand;

  const { data: workers = [] } = api.worker.getWorkers.useQuery({ strandSlug });
  const { data: stores = [] } = api.store.getAllStores.useQuery({ strandSlug });
  const { data: allWorkshifts = [], refetch: refetchWorkshifts } =
    api.workshift.getAll.useQuery({ strandSlug });
  const { data: allWages = [], refetch: refetchWages } =
    api.worker.getAllWages.useQuery({ strandSlug });

  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [dateFrom, setDateFrom] = useState<string>(defaultSeasonStart());
  const [dateTo, setDateTo] = useState<string>("");

  const { mutate: setWagePaid } = api.worker.setWagePaid.useMutation({
    onSuccess: () => void refetchWages(),
  });

  const { mutate: deleteWorkShift, isPending: isDeleting } =
    api.workshift.deleteWorkShift.useMutation({
      onSuccess: () => {
        void refetchWorkshifts();
        void refetchWages();
      },
    });

  const [workshiftToDelete, setWorkshiftToDelete] = useState<
    | null
    | { id: string; date: string }
  >(null);

  const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
  const toMs = dateTo ? new Date(dateTo).getTime() + 86_400_000 - 1 : null;

  const displayWorkshifts = useMemo(() => {
    return allWorkshifts.filter((ws) => {
      if (selectedWorker && ws.workerId !== selectedWorker) return false;
      if (selectedStore && ws.storeId !== selectedStore) return false;
      const t = new Date(ws.date).getTime();
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
      return true;
    });
  }, [allWorkshifts, selectedWorker, selectedStore, fromMs, toMs]);

  const filteredWages = useMemo(() => {
    return allWages.filter((w) => {
      if (selectedWorker && w.workerId !== selectedWorker) return false;
      if (selectedStore && w.workShift?.storeId !== selectedStore) return false;
      const t = new Date(w.date).getTime();
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
      return true;
    });
  }, [allWages, selectedWorker, selectedStore, fromMs, toMs]);

  const totalWage = filteredWages.reduce((sum, w) => sum + w.amount, 0);
  const paidTotal = filteredWages
    .filter((w) => w.paid)
    .reduce((s, w) => s + w.amount, 0);
  const pendingTotal = filteredWages
    .filter((w) => !w.paid)
    .reduce((s, w) => s + w.amount, 0);

  const getWorkerName = (workerId: string) =>
    workers.find((w) => w.id === workerId)?.name ?? "";
  const getStoreName = (storeId: string) =>
    stores.find((s) => s.id === storeId)?.name ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-0">
      <h1 className="mb-6 text-3xl font-bold">Ledolgozott órák</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <Label>Dolgozó</Label>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="w-full rounded border bg-background px-3 py-2"
          >
            <option value="">Összes</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Üzlet</Label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full rounded border bg-background px-3 py-2"
          >
            <option value="">Összes</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="ws-from">Dátum -tól</Label>
          <Input
            id="ws-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <Label htmlFor="ws-to">Dátum -ig</Label>
          <div className="flex items-center gap-2">
            <Input
              id="ws-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full"
            />
            {dateTo && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDateTo("")}
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-2 text-sm text-muted-foreground">
        {displayWorkshifts.length} bejegyzés
        {dateFrom ? ` · ${dateFrom}` : ""}
        {dateTo ? ` - ${dateTo}` : dateFrom ? " - " : ""}
      </div>

      <table className="mb-8 w-full rounded border">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">Dolgozó</th>
            <th className="p-2 text-left">Üzlet</th>
            <th className="p-2 text-left">Dátum</th>
            <th className="p-2 text-left">Megjegyzés</th>
            <th className="p-2 text-left">Művelet</th>
          </tr>
        </thead>
        <tbody>
          {displayWorkshifts.map((ws) => (
            <tr key={ws.id} className="border-t">
              <td className="p-2">{getWorkerName(ws.workerId)}</td>
              <td className="p-2">{getStoreName(ws.storeId)}</td>
              <td className="p-2">{new Date(ws.date).toLocaleDateString()}</td>
              <td className="p-2">{ws.note ?? "-"}</td>
              <td className="p-2">
                <Dialog
                  open={workshiftToDelete?.id === ws.id}
                  onOpenChange={(open) => !open && setWorkshiftToDelete(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() =>
                        setWorkshiftToDelete({
                          id: ws.id,
                          date:
                            typeof ws.date === "string"
                              ? ws.date
                              : ws.date.toISOString(),
                        })
                      }
                    >
                      Törlés
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Jelenlét törlése</DialogTitle>
                      <DialogDescription>
                        Biztosan törölni szeretnéd ezt a jelenlétet? (
                        {new Date(ws.date).toLocaleDateString()})
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="secondary"
                        onClick={() => setWorkshiftToDelete(null)}
                      >
                        Mégse
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          deleteWorkShift({ id: ws.id });
                          setWorkshiftToDelete(null);
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Törlés..." : "Törlés"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </td>
            </tr>
          ))}
          {displayWorkshifts.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="p-3 text-center text-muted-foreground"
              >
                Nincs adat a kiválasztott szűrőkre.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="rounded border bg-muted/30 p-4">
        <h2 className="mb-3 text-lg font-semibold">
          Munkabér összesítő
          {selectedWorker
            ? ` (${workers.find((w) => w.id === selectedWorker)?.name ?? ""})`
            : " (minden dolgozó)"}
        </h2>
        <table className="mb-2 w-full rounded border bg-background">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Dátum</th>
              {!selectedWorker && <th className="p-2 text-left">Dolgozó</th>}
              <th className="p-2 text-left">Összeg</th>
              <th className="p-2 text-left">Megjegyzés</th>
              <th className="p-2 text-left">Kifizetve</th>
            </tr>
          </thead>
          <tbody>
            {filteredWages.map((w) => (
              <tr
                key={w.id}
                className={`border-t ${w.paid ? "bg-emerald-50/60" : ""}`}
              >
                <td className="p-2">
                  {new Date(w.date).toLocaleDateString()}
                </td>
                {!selectedWorker && (
                  <td className="p-2">{getWorkerName(w.workerId)}</td>
                )}
                <td className="p-2">{w.amount.toLocaleString()} Ft</td>
                <td className="p-2">{w.workShift?.note ?? "-"}</td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => setWagePaid({ id: w.id, paid: !w.paid })}
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
            ))}
            {filteredWages.length === 0 && (
              <tr>
                <td
                  colSpan={selectedWorker ? 4 : 5}
                  className="p-2 text-center text-muted-foreground"
                >
                  Nincs munkabér ebben az időszakban.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center gap-4">
          <div className="font-bold">
            Teljes munkabér: {totalWage.toLocaleString()} Ft
          </div>
          <div className="text-sm text-emerald-700">
            Kifizetve: {paidTotal.toLocaleString()} Ft
          </div>
          <div className="text-sm text-amber-700">
            Függőben: {pendingTotal.toLocaleString()} Ft
          </div>
        </div>
      </div>
    </div>
  );
}
