"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { supabase } from "~/server/auth/supabaseClient";
import ProductGridAdmin from "~/components/admin/ProductGridAdmin";
import { set } from "date-fns";

const ProductsPage = () => {
  const [isImageCreating, setIsImageCreating] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [storeId, setStoreId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<null | {
    id: string;
    name: string;
  }>(null);

  const {
    data: products,
    refetch,
    isFetching,
  } = api.product.getAllProducts.useQuery();
  const { data: stores } = api.store.getAllStores.useQuery();

  const { mutate: createProduct, isPending: isCreating } =
    api.product.createProduct.useMutation({
      onSuccess: () => {
        void refetch();
        setSelectedId(null);
        setName("");
        setPrice("");

        setStock("");
        setStoreId("");
        setCreateDialogOpen(false);
      },
    });

  const { mutate: deleteProduct } = api.product.deleteProduct.useMutation({
    onSuccess: () => {
      void refetch();
      setProductToDelete(null);
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock || !storeId || !file) return;

    setIsImageCreating(true);

    const sanitizeFileName = (name: string) => {
      return name.replace(/[^a-zA-Z0-9._-]/g, "_"); 
    };

    const originalName = file?.name || "file.png";
    const uniqueFileName = `${Date.now()}_${sanitizeFileName(originalName)}`;
    const { data, error } = await supabase.storage
      .from("images")
      .upload(uniqueFileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error || !data) {
      console.error("Image upload failed:", error?.message);
      alert("Kép feltöltése sikertelen. Próbáld újra.");
      setIsImageCreating(false);
      return;
    }

    const imageUrl = data.path; // safer than fullPath

    createProduct({
      id: selectedId ?? "",
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      imageUrl,
      storeId,
    });

    setIsImageCreating(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Termékek</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Új termék</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Új termék hozzáadása</DialogTitle>
                <DialogDescription>
                  Töltsd ki a termék adatait és rendeld hozzá egy bolthoz.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div>
                  <Label className="mb-2">Név</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Termék neve"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2">Ár (HUF)</Label>
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
                  <Label className="mb-2">Készlet</Label>
                  <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="pl. 50"
                    required
                  />
                  <Label className="mb-2">Kép</Label>
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2">Bolt</Label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full rounded border px-3 py-2"
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
                <Button type="submit" disabled={isCreating || isImageCreating}>
                  {isCreating ? "Létrehozás..." : "Létrehozás"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isFetching && (
        <p className="text-muted-foreground mb-4 text-sm">
          Termékek betöltése...
        </p>
      )}

      <ul className="space-y-2">
        <ProductGridAdmin
          onEdit={(product) => {
            setName(product.name);
            setPrice(product.price.toString());
            setStock(product.stock.toString());
            setStoreId(product.storeId);
            setSelectedId(product.id);
            setCreateDialogOpen(true);
          }}
        />

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
