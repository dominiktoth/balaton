"use client";
import { useState } from "react";
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

type Workshift = {
  id: string;
  workerId: string;
  storeId: string;
  date: string | Date;
  note?: string | null;
};

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function WorkshiftsPage() {
  const params = useParams<{ strand: string }>();
  const strandSlug = params.strand;

  const { data: workers = [] } = api.worker.getWorkers.useQuery({ strandSlug });
  const { data: stores = [] } = api.store.getAllStores.useQuery({ strandSlug });
  const utils = api.useUtils();

  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data: allWages = [], refetch: refetchWages } = api.worker.getAllWages.useQuery({ strandSlug });

  const { mutate: setWagePaid } = api.worker.setWagePaid.useMutation({
    onSuccess: () => void refetchWages(),
  });

  // Fetch all workshifts for the selected worker, or all if none selected
  const { data: allWorkshifts = [], refetch: refetchWorkshifts } = api.workshift.getWorkShiftsByWorker.useQuery(
    selectedWorker ? { workerId: selectedWorker } : { workerId: "" },
    {
      enabled: !!selectedWorker,
    }
  );
  // Fetch all workshifts for all workers if only date is selected
  const { data: allWorkshiftsByDate = [], refetch: refetchWorkshiftsByDate } = api.workshift.getWorkShiftsByStoreAndDate.useQuery(
    { storeId: "", date: selectedDate },
    { enabled: !!selectedDate && !selectedWorker && !selectedStore }
  );

  const { mutate: deleteWorkShift, isPending: isDeleting } = api.workshift.deleteWorkShift.useMutation({
    onSuccess: () => {
      refetchWorkshifts();
      refetchWorkshiftsByDate();
    },
  });

  const [workshiftToDelete, setWorkshiftToDelete] = useState<null | { id: string; date: string }>(null);

  // Filtering logic
  let displayWorkshifts: Workshift[] = [];
  if (selectedWorker) {
    displayWorkshifts = allWorkshifts.filter(ws =>
      (!selectedStore || ws.storeId === selectedStore) &&
      (!selectedDate || ws.date.toISOString().split('T')[0] === selectedDate)
    );
  } else if (selectedDate && !selectedWorker && !selectedStore) {
    displayWorkshifts = allWorkshiftsByDate;
  }

  // Wage szűrés: csak a kiválasztott dolgozóhoz és dátumtartományhoz tartozó Wage-ek
  const filteredWages = allWages.filter(w =>
    w.workerId === selectedWorker &&
    (!dateFrom || new Date(w.date) >= new Date(dateFrom)) &&
    (!dateTo || new Date(w.date) <= new Date(dateTo))
  );
  const totalWage = filteredWages.reduce((sum, w) => sum + w.amount, 0);

  const getWorkerName = (workerId: string) => workers.find(w => w.id === workerId)?.name || "";
  const getStoreName = (storeId: string) => stores.find(s => s.id === storeId)?.name || "";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-6">Ledolgozott órák</h1>
      <div className="flex gap-4 mb-6">
        <div>
          <Label>Dolgozó</Label>
          <select
            value={selectedWorker}
            onChange={e => setSelectedWorker(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Összes</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Üzlet</Label>
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Összes</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="workshift-date">Dátum</Label>
          <div className="flex items-center gap-2">
            <label htmlFor="workshift-date" style={{ display: "block", cursor: "pointer", flex: 1 }}>
              <Input
                id="workshift-date"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </label>
            {selectedDate && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedDate("")}>Törlés</Button>
            )}
          </div>
        </div>
      </div>
      <table className="w-full border rounded">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">Dolgozó</th>
            <th className="p-2 text-left">Üzlet</th>
            <th className="p-2 text-left">Dátum</th>
            <th className="p-2 text-left">Megjegyzés</th>
            <th className="p-2 text-left">Jelen volt</th>
          </tr>
        </thead>
        <tbody>
          {displayWorkshifts.map(ws => (
            <tr key={ws.id} className="border-t">
              <td className="p-2">{getWorkerName(ws.workerId)}</td>
              <td className="p-2">{getStoreName(ws.storeId)}</td>
              <td className="p-2">{new Date(ws.date).toLocaleDateString()}</td>
              <td className="p-2">{ws.note || "-"}</td>
              <td className="p-2 flex items-center gap-2">
                <span className="text-green-600 font-bold">Igen</span>
                <Dialog
                  open={workshiftToDelete?.id === ws.id}
                  onOpenChange={(open) => !open && setWorkshiftToDelete(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => setWorkshiftToDelete({ id: ws.id, date: typeof ws.date === 'string' ? ws.date : ws.date.toISOString() })}
                      className="ml-2"
                    >
                      Törlés
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Jelenlét törlése</DialogTitle>
                      <DialogDescription>
                        Biztosan törölni szeretnéd ezt a jelenlétet? ({new Date(ws.date).toLocaleDateString()})
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setWorkshiftToDelete(null)}>
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
              <td colSpan={4} className="p-2 text-muted-foreground text-center">Nincs adat.</td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Dátumtartomány szerinti wage összesítő */}
      {selectedWorker && (
        <div className="mt-8 p-4 border rounded bg-muted/30">
          <h2 className="text-lg font-semibold mb-2">Munkabér összesítő ({workers.find(w => w.id === selectedWorker)?.name || ""})</h2>
          <div className="flex gap-4 mb-4">
            <div>
              <Label htmlFor="wage-date-from">Dátum -tól</Label>
              <Input
                id="wage-date-from"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <Label htmlFor="wage-date-to">Dátum -ig</Label>
              <Input
                id="wage-date-to"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <table className="w-full border rounded mb-2">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Dátum</th>
                <th className="p-2 text-left">Összeg</th>
                <th className="p-2 text-left">Megjegyzés</th>
                <th className="p-2 text-left">Kifizetve</th>
              </tr>
            </thead>
            <tbody>
              {filteredWages.map(w => (
                <tr key={w.id} className={`border-t ${w.paid ? "bg-emerald-50/60" : ""}`}>
                  <td className="p-2">{new Date(w.date).toLocaleDateString()}</td>
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
                      title={w.paidAt ? `Kifizetve: ${new Date(w.paidAt).toLocaleString()}` : "Nincs kifizetve"}
                    >
                      {w.paid ? <IconCheck className="size-3.5" /> : <IconX className="size-3.5" />}
                      {w.paid ? "Kifizetve" : "Függőben"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredWages.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-2 text-muted-foreground text-center">Nincs munkabér ebben az időszakban.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-bold">Teljes munkabér: {totalWage.toLocaleString()} Ft</div>
            <div className="text-sm text-emerald-700">
              Kifizetve: {filteredWages.filter(w => w.paid).reduce((s, w) => s + w.amount, 0).toLocaleString()} Ft
            </div>
            <div className="text-sm text-amber-700">
              Függőben: {filteredWages.filter(w => !w.paid).reduce((s, w) => s + w.amount, 0).toLocaleString()} Ft
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 