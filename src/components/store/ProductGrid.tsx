"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "~/hooks/useCart";
import Image from "next/image";
import { api } from "~/trpc/react";
import type { CartItem } from "~/store/cartSlice";
import { Button } from "../ui/button";
import { Plus, Minus } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "~/store/store";
import { Input } from "../ui/input"; // shadcn input component

const ProductGrid = () => {
  const browserUser = useSelector((state: RootState) => state.user.user);
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Debounced search term

  const { data: products = [], isLoading } = api.product.getAllProducts.useQuery({
    store: browserUser?.storeId ?? "",
    search: debouncedSearch, // Pass the debounced search term to the API
  });

  const { addToCart, items } = useCart();

  // Debounce the search term to avoid API calls on every key press
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500); // 500ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  return (
    <div className="px-4 py-6">
      {/* Search Bar */}
      <div className="mb-4">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="relative flex items-center justify-between rounded-lg border p-4 shadow-sm transition hover:shadow-md animate-pulse"
              >
                <div className="flex-1 pr-4">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg"></div>
              </div>
            ))
          : products.map((product) => {
              const cartItem = items.find(
                (item: CartItem) => item.productId === product.id
              );
              const quantity = cartItem?.quantity ?? 0;

              return (
                <div
                  key={product.id}
                  className="relative flex items-center justify-between rounded-lg border p-4 shadow-sm transition hover:shadow-md"
                >
                  {/* Left: Info */}
                  <div className="flex-1 pr-4">
                    <h3 className="text-base font-semibold">{product.name}</h3>

                    {product.store?.name && (
                      <p className="mt-1 text-xs text-gray-400">
                        {product.store.name}
                      </p>
                    )}

                    <div className="mt-2">
                      <span className="text-grey-600 font-semibold text-base">
                        {product.price}
                      </span>
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={`https://pcmnkcdjwqvntgxdwzzc.supabase.co/storage/v1/object/public/images/${product.imageUrl}`}
                      fill
                      alt="Image"
                      className="object-contain h-full w-full rounded-lg"
                    />
                  </div>

                  {/* Cart Controls */}
                  <div className="absolute top-2 right-2 bg-white rounded-full shadow px-2 py-1 flex items-center space-x-2">
                    {quantity > 0 ? (
                      <>
                        <button
                          onClick={() =>
                            addToCart({
                              productId: product.id,
                              name: product.name,
                              price: product.price,
                              quantity: -1,
                            })
                          }
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Minus size={22} />
                        </button>
                        <span className="text-sm font-medium">{quantity}</span>
                        <button
                          onClick={() =>
                            addToCart({
                              productId: product.id,
                              name: product.name,
                              price: product.price,
                              quantity: 1,
                            })
                          }
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Plus size={22} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          addToCart({
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: 1,
                          })
                        }
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <Plus size={22} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default ProductGrid;