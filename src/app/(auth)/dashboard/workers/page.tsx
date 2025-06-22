"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function WorkersPage() {
  const { data: workers = [], refetch } = api.worker.getWorkers.useQuery();
  const { mutate: createWorker, isPending: isCreating } = api.worker.createWorker.useMutation({
    onSuccess: () => {
      setName("");
      void refetch();
    },
  });

  const { mutate: deleteWorker, isPending: isDeleting } = api.worker.deleteWorker.useMutation({
    onSuccess: () => void refetch(),
  });

  const [name, setName] = useState("");

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    createWorker({ name });
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
        <Button type="submit" disabled={isCreating} className="self-end">
          {isCreating ? "Hozzáadás..." : "Hozzáadás"}
        </Button>
      </form>
      <ul className="space-y-2">
        {workers.map((worker) => (
          <li key={worker.id} className="flex justify-between items-center border rounded p-3">
            <span>{worker.name}</span>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={() => deleteWorker({ id: worker.id })}
            >
              {isDeleting ? "Törlés..." : "Törlés"}
            </Button>
          </li>
        ))}
        {workers.length === 0 && <li className="text-muted-foreground">Nincsenek Dolgozók.</li>}
      </ul>
    </div>
  );
} 