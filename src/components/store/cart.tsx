'use client';
import React from 'react';
import { useCart } from '~/hooks/useCart';

const Cart = () => {
  const { items, addToCart, removeFromCart, clear, total } = useCart();

  return (
    <div>
      <h2>Shopping Cart</h2>
      {items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <ul>
          {items.map(item => (
            <li key={item.productId}>
              {item.name} x {item.quantity} = ${item.price * item.quantity}
              <button onClick={() => removeFromCart(item.productId)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <p>Total: ${total}</p>
      <button onClick={clear}>Clear Cart</button>
    </div>
  );
};

export default Cart;
