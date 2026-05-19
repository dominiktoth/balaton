import { useState } from 'react';
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

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function InvestmentDialog({ stores, onSuccess }: { stores: { id: string; name: string }[]; onSuccess?: () => void }) {
  const [amount, setAmount] = useState('');
  const [storeId, setStoreId] = useState('');
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  const { mutate: createInvestment, isPending } = api.investment.createInvestment.useMutation({
    onSuccess: () => {
      setAmount('');
      setStoreId('');
      setDate(getToday());
      setNote('');
      setOpen(false);
      onSuccess?.();
    },
  });

  const formatAmount = (value: string) => {
    const num = value.replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num, 10).toLocaleString('hu-HU');
  };

  const parseAmount = (value: string) => {
    return value.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !storeId || !date) return;
    createInvestment({
      amount: parseFloat(parseAmount(amount)),
      storeId,
      date,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Befektetés hozzáadása</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Új befektetés hozzáadása</DialogTitle>
            <DialogDescription>
              A befektetés nem számít bele a mérlegbe / profitba, külön kezeljük.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2">Összeg</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={e => setAmount(formatAmount(e.target.value))}
                placeholder="0"
                required
              />
            </div>
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
              <Label className="mb-2" htmlFor="investment-date">Dátum</Label>
              <label htmlFor="investment-date" style={{ display: "block", cursor: "pointer" }}>
                <Input
                  id="investment-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>
            </div>
            <div>
              <Label className="mb-2" htmlFor="investment-note">Megjegyzés (opcionális)</Label>
              <Input
                id="investment-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Pl. új hűtő"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Hozzáadás...' : 'Hozzáadás'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
