"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "~/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";

export default function WorkersPage() {
  const { data: workers = [], refetch } = api.worker.getWorkers.useQuery();
  const { data: stores = [] } = api.store.getAllStores.useQuery();
  const { mutate: createWorker, isPending: isCreating } = api.worker.createWorker.useMutation({
    onSuccess: () => {
      setName("");
      setStoreId("");
      void refetch();
    },
  });

  const { mutate: deleteWorker, isPending: isDeleting } = api.worker.deleteWorker.useMutation({
    onSuccess: () => void refetch(),
  });

  const { mutate: updateWorker, isPending: isUpdating } = api.worker.updateWorker.useMutation({
    onSuccess: () => {
      setEditWorker(null);
      void refetch();
    },
  });

  const [name, setName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [editWorker, setEditWorker] = useState<null | { id: string; name: string; storeId: string }>(null);

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !storeId) return;
    createWorker({ name, storeId });
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-6">Dolgozók kezelése</h1>
      <form onSubmit={handleAddWorker} className="flex gap-2 mb-8">
        <div className="flex-1">
          <Label htmlFor="worker-name">Név</Label>
          <Input
            id="worker-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Új dolgozó neve"
            required
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="worker-store">Üzlet</Label>
          <select
            id="worker-store"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Válassz üzletet</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={isCreating} className="self-end">
          {isCreating ? "Hozzáadás..." : "Hozzáadás"}
        </Button>
      </form>
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Név</TableHead>
              <TableHead>Üzlet</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => {
              return (
                <TableRow key={worker.id}>
                  <TableCell>{worker.name}</TableCell>
                  <TableCell>{worker.store ? worker.store.name : "-"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditWorker({ id: worker.id, name: worker.name, storeId: worker.store?.id || "" })}
                    >
                      Szerkesztés
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => deleteWorker({ id: worker.id })}
                    >
                      {isDeleting ? "Törlés..." : "Törlés"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {workers.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground text-center">Nincsenek Dolgozók.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Szerkesztő dialog */}
      <Dialog open={!!editWorker} onOpenChange={(open) => !open && setEditWorker(null)}>
        <DialogContent>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!editWorker) return;
              updateWorker(editWorker);
            }}
          >
            <DialogHeader>
              <DialogTitle>Dolgozó szerkesztése</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-worker-name">Név</Label>
                <Input
                  id="edit-worker-name"
                  value={editWorker?.name || ""}
                  onChange={e => setEditWorker(w => w ? { ...w, name: e.target.value } : w)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-worker-store">Üzlet</Label>
                <select
                  id="edit-worker-store"
                  value={editWorker?.storeId || ""}
                  onChange={e => setEditWorker(w => w ? { ...w, storeId: e.target.value } : w)}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Válassz üzletet</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Mentés..." : "Mentés"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditWorker(null)}>
                Mégse
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 