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
import { Separator } from '~/components/ui/separator';

const StoresPage = () => {
  const [storeName, setStoreName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<null | { id: string; name: string }>(null);

  const { data: stores, refetch, isFetching } = api.store.getAllStores.useQuery();

  const { mutate: createStore, isPending: isCreating } = api.store.createStore.useMutation({
    onSuccess: () => {
      void refetch();
      setStoreName('');
      setCreateDialogOpen(false);
    },
  });

  const { mutate: deleteStore } = api.store.deleteStore.useMutation({
    onSuccess: () => {
      void refetch();
      setStoreToDelete(null);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;
    createStore({ name: storeName });
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stores</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Store</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create a New Store</DialogTitle>
                <DialogDescription>Enter the name of your store.</DialogDescription>
              </DialogHeader>
              <Input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Store Name"
                className="mt-4"
              />
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isFetching && <p className="text-muted-foreground text-sm mb-4">Loading stores...</p>}

      <ul className="space-y-2">
        {stores?.map((store) => (
          <li
            key={store.id}
            className="flex justify-between items-center border rounded p-4"
          >
            <span>{store.name}</span>
            <Dialog open={!!storeToDelete && storeToDelete.id === store.id} onOpenChange={(open) => !open && setStoreToDelete(null)}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setStoreToDelete(store)}
                >
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Delete Store</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete <b>{store.name}</b>?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => setStoreToDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteStore({ id: store.id });
                    }}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </li>
        ))}
        {stores?.length === 0 && !isFetching && (
          <li className="text-muted-foreground text-sm">
            No stores available. Create one to get started!
          </li>
        )}
      </ul>
    </div>
  );
};

export default StoresPage;
