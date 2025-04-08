'use client';

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

const ExpensesPage = () => {
  const [amount, setAmount] = useState('');
  const [storeId, setStoreId] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<null | { id: string; amount: number }>(null);

  const currencyFormatter = new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    maximumFractionDigits: 0,
  });

  const { data: expenses, refetch, isFetching } = api.expense.getAllExpenses.useQuery();
  const { data: stores } = api.store.getAllStores.useQuery();

  const { mutate: createExpense, isPending: isCreating } = api.expense.createExpense.useMutation({
    onSuccess: () => {
      setAmount('');
      setStoreId('');
      setCreateDialogOpen(false);
      void refetch();
    },
  });

  const { mutate: deleteExpense } = api.expense.deleteExpense.useMutation({
    onSuccess: () => {
      setExpenseToDelete(null);
      void refetch();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !storeId) return;
    createExpense({ amount: parseFloat(amount), storeId });
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 md:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kiadások</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Kiadás hozzáadása</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Új kiadás hozzáadása</DialogTitle>
                <DialogDescription>Add meg az összeget és válaszd ki az üzletet.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div >
                  <Label className='mb-2'>Összeg</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label className='mb-2'>Üzlet</Label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Válassz üzletet</option>
                    {stores?.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Hozzáadás...' : 'Hozzáadás'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isFetching && <p className="text-muted-foreground text-sm mb-4">Kiadások betöltése...</p>}

      <ul className="space-y-2">
        {expenses?.map((expense) => (
          <li
            key={expense.id}
            className="flex justify-between items-center border rounded p-4"
          >
            <div>
              <div className="font-medium">{currencyFormatter.format(expense.amount)}</div>
              <div className="text-sm text-muted-foreground">{expense.store.name}</div>
            </div>
            <Dialog
              open={expenseToDelete?.id === expense.id}
              onOpenChange={(open) => !open && setExpenseToDelete(null)}
            >
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setExpenseToDelete(expense)}
                >
                  Törlés
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Kiadás törlése</DialogTitle>
                  <DialogDescription>
                    Biztosan törölni szeretnéd ezt a kiadást ({currencyFormatter.format(expense.amount)})?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setExpenseToDelete(null)}>
                    Mégse
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteExpense({ id: expense.id })}
                  >
                    Törlés
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </li>
        ))}
        {expenses?.length === 0 && !isFetching && (
          <li className="text-muted-foreground">Nincsenek kiadások.</li>
        )}
      </ul>
    </div>
  );
};

export default ExpensesPage;
