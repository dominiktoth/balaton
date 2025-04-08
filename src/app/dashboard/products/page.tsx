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

const ProductsPage = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [storeId, setStoreId] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<null | { id: string; name: string }>(null);

  const { data: products, refetch, isFetching } = api.product.getAllProducts.useQuery();
  const { data: stores } = api.store.getAllStores.useQuery();

  const { mutate: createProduct, isPending: isCreating } = api.product.createProduct.useMutation({
    onSuccess: () => {
      void refetch();
      setName('');
      setPrice('');
      setStock('');
      setStoreId('');
      setCreateDialogOpen(false);
    },
  });

  const { mutate: deleteProduct } = api.product.deleteProduct.useMutation({
    onSuccess: () => {
      void refetch();
      setProductToDelete(null);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock || !storeId) return;

    createProduct({
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      storeId,
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 md:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Termékek</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Új termék</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Új termék hozzáadása</DialogTitle>
                <DialogDescription>Töltsd ki a termék adatait és rendeld hozzá egy bolthoz.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label className='mb-2'>Név</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Termék neve"
                    required
                  />
                </div>
                <div>
                  <Label className='mb-2'>Ár (HUF)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="pl. 2499"
                    required
                  />
                </div>
                <div>
                  <Label className='mb-2'>Készlet</Label>
                  <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="pl. 50"
                    required
                  />
                </div>
                <div>
                  <Label className='mb-2'>Bolt</Label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Válassz boltot</option>
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
                  {isCreating ? 'Létrehozás...' : 'Létrehozás'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isFetching && <p className="text-muted-foreground text-sm mb-4">Termékek betöltése...</p>}

      <ul className="space-y-2">
        {products?.map((product) => (
          <li
            key={product.id}
            className="flex justify-between items-center border rounded p-4"
          >
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-muted-foreground">
                Ár: {new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF' }).format(product.price)} | Készlet: {product.stock}
              </div>
            </div>
            <Dialog
              open={!!productToDelete && productToDelete.id === product.id}
              onOpenChange={(open) => !open && setProductToDelete(null)}
            >
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setProductToDelete(product)}
                >
                  Törlés
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Termék törlése</DialogTitle>
                  <DialogDescription>
                    Biztosan törölni szeretnéd a <b>{product.name}</b> terméket?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => setProductToDelete(null)}
                  >
                    Mégse
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteProduct({ id: product.id });
                    }}
                  >
                    Törlés
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </li>
        ))}
        {products?.length === 0 && !isFetching && (
          <li className="text-muted-foreground text-sm">
            Nincs elérhető termék. Hozz létre egyet a kezdéshez!
          </li>
        )}
      </ul>
    </div>
  );
};

export default ProductsPage;
