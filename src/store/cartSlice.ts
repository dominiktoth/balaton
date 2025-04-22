'use client';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

export const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        item => item.productId === action.payload.productId
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
        // Remove item if quantity is zero or less
        if (existingItem.quantity <= 0) {
          state.items = state.items.filter(
            item => item.productId !== action.payload.productId
          );
        }
      } else {
        // Only add if quantity is positive
        if (action.payload.quantity > 0) {
          state.items.push(action.payload);
        }
      }
    },
    
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        item => item.productId !== action.payload
      );
    },
    clearCart: state => {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;