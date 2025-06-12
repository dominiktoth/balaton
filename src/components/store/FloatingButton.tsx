// components/FloatingCartButton.tsx
'use client';

import React from 'react';
import { useCart } from '~/hooks/useCart';

const FloatingCartButton = ({ onClick }: { onClick: () => void }) => {
  const { items, total } = useCart();

  if (items.length === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-400 text-white px-6 py-3 rounded-full shadow-lg z-50"
    >
      🛒 {items.length} Termék – Teljes ár {total}
    </button>
  );
};

export default FloatingCartButton;
