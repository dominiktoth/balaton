'use client';

import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useCart } from '~/hooks/useCart';
import { api } from '~/trpc/react';

const CartDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { items, total, clear } = useCart();
  const {mutate:createOrder, isPending} = api.order.createOrder.useMutation();

  const handleConfirm = async () => {
    await createOrder({
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      total,
      storeId: '0c7635b8-2781-4109-bceb-c7a3a3b524ec', 
    });

    clear();
    onClose();
    alert(`Thank you! Total: ALL ${total}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50 min-h-30vh">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg min-h-[30vh] flex flex-col justify-between">
        <h2 className="text-xl font-semibold mb-4">Rendelés összegzése</h2>
        <ul className="mb-4">
          {items.map(item => (
            <li key={item.productId} className="flex justify-between mb-2">
              <span>{item.name} × {item.quantity}</span>
              <span> {item.price * item.quantity}</span>
            </li>
          ))}
        </ul>
        <p className="font-bold text-right mb-4">Teljes összeg:{total}</p>
        <div className="flex justify-between gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />} Vissza
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-500 text-white rounded"
            disabled={isPending}
          >
           {isPending && <Loader2 className="animate-spin" />} Fizetve
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDialog;
