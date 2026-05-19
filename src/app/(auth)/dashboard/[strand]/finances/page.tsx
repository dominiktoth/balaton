"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";

type FinanceItem = {
  id: string;
  amount: number;
  date: string | Date;
  storeId: string;
};

export default function FinancesPage() {
  const params = useParams<{ strand: string }>();
  const strandSlug = params.strand;

  const { data: stores = [] } = api.store.getAllStores.useQuery({ strandSlug });
  const [selectedStore, setSelectedStore] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tab, setTab] = useState("incomes");
  const [editItem, setEditItem] = useState<FinanceItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<FinanceItem | null>(null);
  const [editType, setEditType] = useState<"income" | "expense" | "investment" | null>(null);

  // Fetch incomes and expenses for the selected store and date range
  const { data: incomes = [], refetch: refetchIncomes } = api.income.getAllIncomes.useQuery({ strandSlug }, { enabled: !!selectedStore });
  const { data: expenses = [], refetch: refetchExpenses } = api.expense.getAllExpenses.useQuery({ strandSlug }, { enabled: !!selectedStore });
  const { data: investments = [], refetch: refetchInvestments } = api.investment.getAllInvestments.useQuery({ strandSlug }, { enabled: !!selectedStore });

  // Mutations
  const { mutate: updateIncome } = api.income.updateIncome.useMutation({
    onSuccess: () => { setEditItem(null); refetchIncomes(); },
  });
  const { mutate: deleteIncome } = api.income.deleteIncome.useMutation({
    onSuccess: () => { setDeleteItem(null); refetchIncomes(); },
  });
  const { mutate: updateExpense } = api.expense.updateExpense.useMutation({
    onSuccess: () => { setEditItem(null); refetchExpenses(); },
  });
  const { mutate: deleteExpense } = api.expense.deleteExpense.useMutation({
    onSuccess: () => { setDeleteItem(null); refetchExpenses(); },
  });
  const { mutate: updateInvestment } = api.investment.updateInvestment.useMutation({
    onSuccess: () => { setEditItem(null); refetchInvestments(); },
  });
  const { mutate: deleteInvestment } = api.investment.deleteInvestment.useMutation({
    onSuccess: () => { setDeleteItem(null); refetchInvestments(); },
  });

  // Filter by store and date range
  const filterByStoreAndDate = (arr: FinanceItem[]) =>
    arr.filter((item) =>
      item.storeId === selectedStore &&
      (!startDate || new Date(item.date) >= new Date(startDate)) &&
      (!endDate || new Date(item.date) <= new Date(endDate))
    );

  const filteredIncomes = filterByStoreAndDate(incomes);
  const filteredExpenses = filterByStoreAndDate(expenses);
  const filteredInvestments = filterByStoreAndDate(investments);
  const totalInvestments = filteredInvestments.reduce((sum, i) => sum + i.amount, 0);

  // Edit form state
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");

  const openEdit = (item: FinanceItem, type: "income" | "expense" | "investment") => {
    setEditType(type);
    setEditItem(item);
    setEditAmount(item.amount.toString());
    let dateString = "";
    if (typeof item.date === "string") {
      dateString = String(item.date ?? '').split("T")[0] || '';
    } else if (item.date instanceof Date) {
      dateString = (item.date ? item.date.toISOString() : '').split("T")[0] || '';
    }
    setEditDate(dateString);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    if (editType === "income") {
      updateIncome({ id: editItem.id, amount: parseFloat(editAmount), date: editDate });
    } else if (editType === "investment") {
      updateInvestment({ id: editItem.id, amount: parseFloat(editAmount), date: editDate });
    } else {
      updateExpense({ id: editItem.id, amount: parseFloat(editAmount), date: editDate });
    }
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    if (tab === "incomes") {
      deleteIncome({ id: deleteItem.id });
    } else if (tab === "investments") {
      deleteInvestment({ id: deleteItem.id });
    } else {
      deleteExpense({ id: deleteItem.id });
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-6">Bolt bevételek, kiadások és befektetések</h1>
      <div className="flex gap-4 mb-6">
        <div>
          <Label>Üzlet</Label>
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Válassz üzletet</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="start-date">Dátum -tól</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <Label htmlFor="end-date">Dátum -ig</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="incomes">Bevételek</TabsTrigger>
          <TabsTrigger value="expenses">Kiadások</TabsTrigger>
          <TabsTrigger value="investments">Befektetések</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "incomes" && (
        <table className="w-full border rounded mb-8">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Dátum</th>
              <th className="p-2 text-left">Összeg</th>
              <th className="p-2 text-left">Művelet</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncomes.map((income) => (
              <tr key={income.id} className="border-t">
                <td className="p-2">{new Date(income.date).toLocaleDateString()}</td>
                <td className="p-2">{income.amount.toLocaleString()} Ft</td>
                <td className="p-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(income, "income")}>Szerkeszt</Button>
                  <Button size="sm" variant="destructive" className="ml-2" onClick={() => setDeleteItem(income)}>Törlés</Button>
                </td>
              </tr>
            ))}
            {filteredIncomes.length === 0 && (
              <tr>
                <td colSpan={3} className="p-2 text-muted-foreground text-center">Nincs adat.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {tab === "expenses" && (
        <table className="w-full border rounded mb-8">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Dátum</th>
              <th className="p-2 text-left">Összeg</th>
              <th className="p-2 text-left">Művelet</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} className="border-t">
                <td className="p-2">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="p-2">{expense.amount.toLocaleString()} Ft</td>
                <td className="p-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(expense, "expense")}>Szerkeszt</Button>
                  <Button size="sm" variant="destructive" className="ml-2" onClick={() => setDeleteItem(expense)}>Törlés</Button>
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={3} className="p-2 text-muted-foreground text-center">Nincs adat.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {tab === "investments" && (
        <>
          <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            A befektetések <b>nem</b> számítanak bele a mérlegbe / profitba — itt külön követjük őket.
          </div>
          <table className="w-full border rounded mb-3">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Dátum</th>
                <th className="p-2 text-left">Összeg</th>
                <th className="p-2 text-left">Megjegyzés</th>
                <th className="p-2 text-left">Művelet</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.map((investment) => (
                <tr key={investment.id} className="border-t">
                  <td className="p-2">{new Date(investment.date).toLocaleDateString()}</td>
                  <td className="p-2">{investment.amount.toLocaleString()} Ft</td>
                  <td className="p-2">{(investment as { note?: string | null }).note ?? "-"}</td>
                  <td className="p-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(investment, "investment")}>Szerkeszt</Button>
                    <Button size="sm" variant="destructive" className="ml-2" onClick={() => setDeleteItem(investment)}>Törlés</Button>
                  </td>
                </tr>
              ))}
              {filteredInvestments.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-2 text-muted-foreground text-center">Nincs adat.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mb-8 font-bold">
            Befektetések összesen: {totalInvestments.toLocaleString()} Ft
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{editType === "income" ? "Bevétel szerkesztése" : editType === "investment" ? "Befektetés szerkesztése" : "Kiadás szerkesztése"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Összeg</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-date">Dátum</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">Mentés</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={open => !open && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Törlés megerősítése</DialogTitle>
            <DialogDescription>
              Biztosan törölni szeretnéd ezt az elemet?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteItem(null)}>Mégse</Button>
            <Button variant="destructive" onClick={handleDelete}>Törlés</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 