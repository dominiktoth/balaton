import { useState, useEffect } from 'react';
import { api } from '~/trpc/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export function WorkshiftDialog({ stores, onSuccess }: {
  stores: { id: string; name: string }[];
  onSuccess?: () => void;
}) {
  const [storeId, setStoreId] = useState('');
  const [date, setDate] = useState('');
  const [present, setPresent] = useState<{ [workerId: string]: boolean }>({});
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  // Lekérjük az adott üzlet dolgozóit
  const { data: workers = [] } = api.worker.getWorkersByStore.useQuery({ storeId }, { enabled: !!storeId });

  // Fetch existing workshifts for the selected store and date
  const { data: existingWorkshifts = [], refetch: refetchExisting } = api.workshift.getWorkShiftsForStoreAndDateAllWorkers.useQuery(
    { storeId, date },
    { enabled: !!storeId && !!date }
  );

  // Pre-fill jelenlét, ha már van rögzítve
// Reset on store/date change
useEffect(() => {
  // Reseteljük a jelenlétet, ha változik az üzlet vagy dátum
  setPresent({});
}, [storeId, date]);

useEffect(() => {
  if (existingWorkshifts.length > 0) {
    const newPresent: { [workerId: string]: boolean } = {};
    for (const ws of existingWorkshifts) {
      newPresent[ws.workerId] = true;
    }
    setPresent(newPresent);
  }
}, [existingWorkshifts]);

  
  

  const utils = api.useUtils();
  const { mutateAsync: createWorkShift, isPending: isCreating } = api.workshift.createWorkShift.useMutation({
    onSuccess: () => {
      utils.worker.getAllWages.invalidate();
    },
  });
  const { mutateAsync: deleteWorkShift } = api.workshift.deleteWorkShift.useMutation({
    onSuccess: () => {
      utils.worker.getAllWages.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !date) return;
    const promises: Promise<unknown>[] = [];
    for (const worker of workers as { id: string }[]) {
      const isPresent = present[worker.id];
      const existing = (existingWorkshifts as { workerId: string; id: string }[]).find(ws => ws.workerId === worker.id);
      if (isPresent && !existing) {
        promises.push(createWorkShift({ workerId: worker.id, storeId, date, note: note || undefined }));
      } else if (!isPresent && existing) {
        promises.push(deleteWorkShift({ id: existing.id }));
      }
    }
    await Promise.all(promises);
    setStoreId('');
    setDate('');
    setPresent({});
    setNote("");
    setOpen(false);
    onSuccess?.();
    void refetchExisting();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Dolgozók jelenlétének rögzítése</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Dolgozók jelenlétének rögzítése</DialogTitle>
            <DialogDescription>Válassz üzletet, dátumot, és pipáld ki, aki dolgozott aznap. A már rögzített jelenlét szerkeszthető.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2">Üzlet</Label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Válassz üzletet</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2" htmlFor="workshift-date">Dátum</Label>
              <label htmlFor="workshift-date" style={{ display: "block", cursor: "pointer" }}>
                <Input
                  id="workshift-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>
            </div>
            <div>
              <Label className="mb-2" htmlFor="workshift-note">Megjegyzés (opcionális)</Label>
              <Input
                id="workshift-note"
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Pl. helyettesítés, extra info..."
              />
            </div>
            <div>
              <Label className="mb-2">Dolgozók jelenléte</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {workers.map((worker) => {
                  const existing = existingWorkshifts.find(ws => ws.workerId === worker.id);
                  return (
                    <div key={worker.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!present[worker.id]}
                        onChange={(e) => setPresent((prev) => ({ ...prev, [worker.id]: e.target.checked }))}
                        id={`present-${worker.id}`}
                      />
                      <label htmlFor={`present-${worker.id}`} className="w-32 cursor-pointer">
                        {worker.name}
                      </label>
                      {existing && <span className="text-xs text-muted-foreground">(már rögzítve)</span>}
                    </div>
                  );
                })}
                {workers.length === 0 && <div className="text-muted-foreground">Nincs dolgozó ebben az üzletben.</div>}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Mentés...' : 'Mentés'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 