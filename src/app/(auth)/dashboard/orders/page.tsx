'use client';

import React, { useState } from 'react';
import CartDialog from '~/components/store/CartDialog';
import FloatingCartButton from '~/components/store/FloatingButton';
import ProductGrid from '~/components/store/ProductGrid';

const MenuPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="relative min-h-screen pb-24">
      <ProductGrid />
      <FloatingCartButton onClick={() => setDialogOpen(true)} />
      <CartDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
};

export default MenuPage;
