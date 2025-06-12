'use client';

import React, { useState } from 'react';
import { useCart } from '~/hooks/useCart';
import { api } from '~/trpc/react';

const AddToCartForm = () => {
  const { addToCart } = useCart();
  const { data: products , isLoading, error } = api.product.getAllProducts.useQuery();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProduct = products?.find(p => p.id === selectedProductId);
    if (!selectedProduct) {
      alert('Please select a valid product.');
      return;
    }

    addToCart({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity,
    });

    setSelectedProductId('');
    setQuantity(1);
  };

  if (isLoading) return <p>Loading products...</p>;
  if (error) return <p>Error loading products.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add Item to Cart</h3>

      <div>
        <label className="block mb-1">Product:</label>
        <select
          value={selectedProductId}
          onChange={e => setSelectedProductId(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select a product --</option>
          {products?.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} - ${product.price}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Quantity:</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
      </div>
      <div>

        <span>{quantity}</span>
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Add to Cart
      </button>
    </form>
  );
};

export default AddToCartForm;
