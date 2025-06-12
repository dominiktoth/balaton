'use client';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, clearCart, removeItem, type CartItem } from '~/store/cartSlice';


export const useCart = () => {
  const items = useSelector((state: { cart: { items: CartItem[] } }) => state.cart.items);
  const dispatch = useDispatch();

  const addToCart = (item: CartItem) => {
    dispatch(addItem(item));
  };

  const removeFromCart = (productId: string) => {
    dispatch(removeItem(productId));
  };

  const clear = () => {
    dispatch(clearCart());
  };

  const total = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);

  return {
    items,
    addToCart,
    removeFromCart,
    clear,
    total,
  };
};
