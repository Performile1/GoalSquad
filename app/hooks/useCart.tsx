'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sellerId: string;      // seller_profiles.id (UUID)
  sellerName: string;
  sellerAvatar?: string;
  campaignId?: string;
}

const CART_KEY = 'goalsquad_cart';

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('goalsquad-cart-updated', { detail: items }));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    const syncCart = (event: Event) => {
      const nextItems = event instanceof StorageEvent
        ? readCart()
        : ((event as CustomEvent<CartItem[]>).detail || readCart());
      setItems((currentItems) =>
        JSON.stringify(currentItems) === JSON.stringify(nextItems) ? currentItems : nextItems
      );
    };

    window.addEventListener('storage', syncCart);
    window.addEventListener('goalsquad-cart-updated', syncCart);
    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('goalsquad-cart-updated', syncCart);
    };
  }, []);

  useEffect(() => {
    if (loaded) writeCart(items);
  }, [items, loaded]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }, []);

  const updateQty = useCallback((productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, addItem, updateQty, removeItem, clearCart, total, count, loaded };
}
