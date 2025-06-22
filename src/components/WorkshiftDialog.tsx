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

export function WorkshiftDialog({ stores, workers, onSuccess }: {
  stores: { id: string; name: string }[];
  workers: { id: string; name: string }[];
  onSuccess?: () => void;
}) {
  const [storeId, setStoreId] = useState('');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState<{ [workerId: string]: string }>({});
  const [open, setOpen] = useState(false);

  // Fetch existing workshifts for the selected store and date
  const { data: existingWorkshifts = [], refetch: refetchExisting } = api.workshift.getWorkShiftsForStoreAndDateAllWorkers.useQuery(
    { storeId, date },
    { enabled: !!storeId && !!date }
  );

  // Pre-fill hours when existingWorkshifts change
  useEffect(() => {
    if (existingWorkshifts && existingWorkshifts.length > 0) {
      const newHours: { [workerId: string]: string } = {};
      for (const ws of existingWorkshifts) {
        newHours[ws.workerId] = ws.hours.toString();
      }
      setHours((prev) => ({ ...prev, ...newHours }));
    }
  }, [existingWorkshifts]);

  const { mutateAsync: createWorkShift, isPending: isCreating } = api.workshift.createWorkShift.useMutation();
  const { mutateAsync: updateWorkShift } = api.workshift.updateWorkShift.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !date) return;
    const promises: Promise<any>[] = [];
    for (const worker of workers) {
      const value = hours[worker.id];
      const existing = existingWorkshifts.find(ws => ws.workerId === worker.id);
      if (value && parseFloat(value) > 0) {
        if (existing) {
          if (existing.hours !== parseFloat(value)) {
            promises.push(updateWorkShift({ id: existing.id, hours: parseFloat(value) }));
          }
        } else {
          promises.push(createWorkShift({
            workerId: worker.id,
            storeId,
            date,
            hours: parseFloat(value),
          }));
        }
      }
    }
    await Promise.all(promises);
    setStoreId('');
    setDate('');
    setHours({});
    setOpen(false);
    onSuccess?.();
    void refetchExisting();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Dolgozók óráinak rögzítése</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Dolgozók óráinak rögzítése</DialogTitle>
            <DialogDescription>Válassz üzletet, dátumot, és add meg a ledolgozott órákat minden dolgozónál. A már rögzített órák szerkeszthetők.</DialogDescription>
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
              <Label className="mb-2">Dolgozók órái</Label>
              <div className="space-y-2">
                {workers.map((worker) => {
                  const existing = existingWorkshifts.find(ws => ws.workerId === worker.id);
                  return (
                    <div key={worker.id} className="flex items-center gap-2">
                      <span className="w-32">{worker.name}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={hours[worker.id] || ''}
                        onChange={(e) => setHours((prev) => ({ ...prev, [worker.id]: e.target.value }))}
                        placeholder="Órák száma"
                      />
                      {existing && <span className="text-xs text-muted-foreground">(már rögzítve)</span>}
                    </div>
                  );
                })}
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