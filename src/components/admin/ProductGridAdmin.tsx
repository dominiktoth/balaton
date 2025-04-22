"use client";

import { api } from "~/trpc/react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "~/components/ui/dialog";

interface ProductGridAdminProps {
  onEdit: (product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl: string;
    storeId: string;
  }) => void;
}

const ProductGridAdmin = ({ onEdit }: ProductGridAdminProps) => {
  const { data: products = [], isFetching, refetch } = api.product.getAllProducts.useQuery();
  const { mutate: deleteProduct } = api.product.deleteProduct.useMutation({
    onSuccess: () => void refetch(),
  });

  const [productToDelete, setProductToDelete] = useState<null | {
    id: string;
    name: string;
  }>(null);

  if (isFetching) return <p>Termékek betöltése...</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="relative flex flex-col justify-between rounded-lg border p-4 shadow-sm hover:shadow-md"
        >
          <div className="mb-3">
            <div className="relative w-full h-40 mb-2 rounded-md overflow-hidden">
              <Image
                src={`https://pcmnkcdjwqvntgxdwzzc.supabase.co/storage/v1/object/public//images/${product.imageUrl}`}
                alt={product.name}
                fill
                className="object-contain rounded-md"
              />
            </div>
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.store?.name}</p>
            <p className="mt-1 text-base font-semibold">
              {new Intl.NumberFormat("hu-HU", {
                style: "currency",
                currency: "HUF",
              }).format(product.price)}
            </p>
            <p className="text-sm text-gray-400">Készlet: {product.stock}</p>
          </div>

          <div className="flex justify-between">
            <Button
              size="sm"
              onClick={() =>
                onEdit({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  stock: product.stock,
                  imageUrl: product.imageUrl?? '',
                  storeId: product.storeId,
                })
              }
            >
              Módosítás
            </Button>

            <Dialog
              open={!!productToDelete && productToDelete.id === product.id}
              onOpenChange={(open) => !open && setProductToDelete(null)}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setProductToDelete({
                      id: product.id,
                      name: product.name,
                    })
                  }
                >
                  Törlés
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Termék törlése</DialogTitle>
                  <DialogDescription>
                    Biztosan törölni szeretnéd a{" "}
                    <b>{productToDelete?.name}</b> terméket?
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
                      if (productToDelete) {
                        deleteProduct({ id: productToDelete.id });
                      }
                    }}
                  >
                    Törlés
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGridAdmin;
