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
import {useFormatter} from 'next-intl';


const ExpensesPage = () => {
  const [amount, setAmount] = useState('');
  const [storeId, setStoreId] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<null | { id: string; amount: number }>(null);

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
    <div className="max-w-2xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add a New Expense</DialogTitle>
                <DialogDescription>Enter amount and select a store.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label>Store</Label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Store</option>
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
                  {isCreating ? 'Adding...' : 'Add Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isFetching && <p className="text-muted-foreground text-sm mb-4">Loading expenses...</p>}

      <ul className="space-y-2">
        {expenses?.map((expense) => (
          <li
            key={expense.id}
            className="flex justify-between items-center border rounded p-4"
          >
            <div>
              <div className="font-medium">{expense.amount}Ft </div>
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
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Delete Expense</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this expense of €{expense.amount.toFixed(2)}?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setExpenseToDelete(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteExpense({ id: expense.id })}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </li>
        ))}
        {expenses?.length === 0 && !isFetching && (
          <li className="text-muted-foreground">No expenses found.</li>
        )}
      </ul>
    </div>
  );
};

export default ExpensesPage;
