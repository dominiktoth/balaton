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

export function IncomeDialog({ stores, onSuccess }: { stores: { id: string; name: string }[]; onSuccess?: () => void }) {
  const [amount, setAmount] = useState('');
  const [storeId, setStoreId] = useState('');
  const [date, setDate] = useState('');
  const [open, setOpen] = useState(false);

  const { mutate: createIncome, isPending } = api.income.createIncome.useMutation({
    onSuccess: () => {
      setAmount('');
      setStoreId('');
      setDate('');
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
    createIncome({ amount: parseFloat(parseAmount(amount)), storeId, date });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Bevétel hozzáadása</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Új bevétel hozzáadása</DialogTitle>
            <DialogDescription>Add meg az összeget, az üzletet és a dátumot.</DialogDescription>
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
              <Label className="mb-2" htmlFor="income-date">Dátum</Label>
              <label htmlFor="income-date" style={{ display: "block", cursor: "pointer" }}>
                <Input
                  id="income-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>
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