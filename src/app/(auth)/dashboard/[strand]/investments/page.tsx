"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { InvestmentDialog } from "~/components/InvestmentDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";

type InvestmentItem = {
  id: string;
  amount: number;
  date: string | Date;
  note: string | null;
  storeId: string;
  store?: { name: string } | null;
};

export default function InvestmentsPage() {
  const params = useParams<{ strand: string }>();
  const strandSlug = params.strand;

  const { data: strand } = api.strand.getBySlug.useQuery({ slug: strandSlug });
  const { data: stores = [] } = api.store.getAllStores.useQuery({ strandSlug });
  const { data: investments = [], refetch, isFetching } =
    api.investment.getAllInvestments.useQuery({ strandSlug });

  const [selectedStore, setSelectedStore] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [editItem, setEditItem] = useState<InvestmentItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InvestmentItem | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");

  const { mutate: updateInvestment, isPending: isUpdating } =
    api.investment.updateInvestment.useMutation({
      onSuccess: () => {
        setEditItem(null);
        void refetch();
      },
    });
  const { mutate: deleteInvestment, isPending: isDeleting } =
    api.investment.deleteInvestment.useMutation({
      onSuccess: () => {
        setDeleteItem(null);
        void refetch();
      },
    });

  const filtered = useMemo(() => {
    return investments.filter((item) => {
      if (selectedStore && item.storeId !== selectedStore) return false;
      if (startDate && new Date(item.date) < new Date(startDate)) return false;
      if (endDate && new Date(item.date) > new Date(endDate)) return false;
      return true;
    });
  }, [investments, selectedStore, startDate, endDate]);

  const total = filtered.reduce((sum, i) => sum + i.amount, 0);

  const openEdit = (item: InvestmentItem) => {
    setEditItem(item);
    setEditAmount(item.amount.toString());
    const d =
      typeof item.date === "string"
        ? item.date
        : item.date.toISOString();
    setEditDate(d.split("T")[0] ?? "");
    setEditNote(item.note ?? "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    updateInvestment({
      id: editItem.id,
      amount: parseFloat(editAmount),
      date: editDate,
      note: editNote.trim() || undefined,
    });
  };

  const hasFilter = !!selectedStore || !!startDate || !!endDate;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {strand?.name ?? "Strand"}
          </p>
          <h1 className="text-3xl font-bold">Befektetések</h1>
        </div>
        {stores.length > 0 && (
          <InvestmentDialog stores={stores} onSuccess={() => void refetch()} />
        )}
      </div>

      <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        A befektetések <b>nem</b> számítanak bele a mérlegbe / profitba — itt
        külön követjük őket.
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="store-filter">Üzlet</Label>
          <select
            id="store-filter"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-56 rounded border bg-background px-3 py-2"
          >
            <option value="">Összes üzlet</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="start-date">Dátum -tól</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div>
          <Label htmlFor="end-date">Dátum -ig</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-44"
          />
        </div>
        {hasFilter && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedStore("");
              setStartDate("");
              setEndDate("");
            }}
          >
            Szűrők törlése
          </Button>
        )}
      </div>

      {isFetching && (
        <p className="mb-4 text-sm text-muted-foreground">
          Befektetések betöltése...
        </p>
      )}

      <table className="mb-4 w-full rounded border">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">Dátum</th>
            <th className="p-2 text-left">Üzlet</th>
            <th className="p-2 text-left">Összeg</th>
            <th className="p-2 text-left">Megjegyzés</th>
            <th className="p-2 text-left">Művelet</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-2">
                {new Date(item.date).toLocaleDateString()}
              </td>
              <td className="p-2">{item.store?.name ?? "-"}</td>
              <td className="p-2">{item.amount.toLocaleString()} Ft</td>
              <td className="p-2">{item.note ?? "-"}</td>
              <td className="p-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(item)}
                >
                  Szerkeszt
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="ml-2"
                  onClick={() => setDeleteItem(item)}
                >
                  Törlés
                </Button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && !isFetching && (
            <tr>
              <td
                colSpan={5}
                className="p-4 text-center text-muted-foreground"
              >
                Nincs befektetés.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between rounded border bg-muted/40 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {filtered.length} tétel
          {selectedStore
            ? ` · ${stores.find((s) => s.id === selectedStore)?.name ?? ""}`
            : " · összes üzlet"}
        </span>
        <span className="text-lg font-bold">
          Összesen: {total.toLocaleString()} Ft
        </span>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Befektetés szerkesztése</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label>Összeg</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-date">Dátum</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-note">Megjegyzés (opcionális)</Label>
                <Input
                  id="edit-note"
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Pl. új hűtő"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Mentés..." : "Mentés"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Befektetés törlése</DialogTitle>
            <DialogDescription>
              Biztosan törölni szeretnéd ezt a befektetést?
              {deleteItem
                ? ` (${deleteItem.amount.toLocaleString()} Ft)`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteItem(null)}>
              Mégse
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() =>
                deleteItem && deleteInvestment({ id: deleteItem.id })
              }
            >
              {isDeleting ? "Törlés..." : "Törlés"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
