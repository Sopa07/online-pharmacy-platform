import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "pharmacy_cart_v1";
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      // Keep cart state persistent across refreshes in this frontend-only demo.
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product) => {
    setItems((previous) => {
      const existing = previous.find((item) => item.id === product.id);
      if (existing) {
        return previous.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...previous,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        }
      ];
    });
  };

  const removeFromCart = (id) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, nextQuantity) => {
    setItems((previous) =>
      previous
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(1, typeof nextQuantity === "function" ? nextQuantity(item.quantity) : nextQuantity)
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const cartCount = useMemo(
    () => items.reduce((count, item) => count + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    subtotal
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
