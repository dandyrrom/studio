'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedCart = localStorage.getItem('hauler_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // This effect is fine, as it runs *after* render
    localStorage.setItem('hauler_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number) => {
    
    // --- STOCK CHECK (Side effect is fine, it's in an event handler) ---
    if (product.stockQuantity <= 0) {
      toast({
          variant: "destructive",
          title: "Out of Stock",
          description: `${product.name} is currently out of stock.`,
      });
      return; 
    }

    // --- SUPPLIER CHECK (Side effect is fine) ---
    if (cart.length > 0 && cart[0].product.supplierId !== product.supplierId) {
      toast({
          variant: "destructive",
          title: "Error adding to cart",
          description: "You can only order from one supplier at a time. Please clear your cart to add items from a different supplier.",
      });
      return;
    }

    const existingItem = cart.find((item) => item.product.id === product.id);
    const moq = product.moq || 1; 

    // --- STOCK CHECK FOR EXISTING ITEM (Side effect is fine) ---
    let newQuantity = (existingItem ? existingItem.quantity : 0) + quantity;
    if (newQuantity > product.stockQuantity) {
      toast({
          variant: "destructive",
          title: "Stock Limit Reached",
          description: `You can only add up to ${product.stockQuantity} units of ${product.name}.`,
      });
      return; // Prevent adding
    }

    // --- MOQ CHECK (Side effect is fine) ---
    let moqToast = false;
    if (newQuantity < moq) {
      toast({
          title: "Minimum Order",
          description: `Adding minimum order of ${moq} units for ${product.name}.`,
      });
      newQuantity = moq; // Adjust quantity to meet MOQ
      moqToast = true;
    }
    // --- END MOQ CHECK ---


    if (existingItem) {
      // 1. Create the new cart array first
      const newCart = cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: newQuantity } // Use calculated newQuantity
          : item
      );
      // 2. Set state with the new array (NOT in an updater function)
      setCart(newCart);

      // 3. Call side effects (toasts) after state update
      if (!moqToast) {
          toast({ title: "Cart updated", description: `${product.name} quantity increased.` });
      }
    } else {
      // 1. Set state with the new array
      setCart([...cart, { product, quantity: newQuantity }]);
      // 2. Call side effects
      toast({ title: "Item added", description: `${newQuantity} ${product.name} added to cart.` });
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
    // This toast is fine, it's not in the 'setCart' updater function
    toast({ title: "Item removed", description: `Item removed from cart.` });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    
    // Flags to track which toasts to show
    let stockLimitToast = false;
    let moqToast = false;
    let stockLimitProductName = "";
    let moqProductName = "";
    let moqValue = 1;
    let stockLimitValue = 0;

    // 1. Create the new cart array first by mapping over the *current* cart state
    const newCart = cart.map((item) => {
      if (item.product.id === productId) {
        const moq = item.product.moq || 1; // <-- Get MOQ

        // --- STOCK CHECK ON UPDATE ---
        if (quantity > item.product.stockQuantity) {
          // Flag for a toast, don't call toast() here
          stockLimitToast = true;
          stockLimitProductName = item.product.name;
          stockLimitValue = item.product.stockQuantity;
          return { ...item, quantity: item.product.stockQuantity }; // Set to max
        }
        // --- MOQ CHECK ON UPDATE ---
        if (quantity < moq) {
          // Flag for a toast, don't call toast() here
          moqToast = true;
          moqProductName = item.product.name;
          moqValue = moq;
          return { ...item, quantity: moq }; // Set to MOQ
        }
        // --- END MOQ CHECK ---
        return { ...item, quantity };
      }
      return item;
    });

    // 2. Set state with the new array
    setCart(newCart);

    // 3. Now that we are back in the event handler, call all side effects
    if (stockLimitToast) {
      toast({
        variant: "destructive",
        title: "Stock Limit Reached",
        description: `You can only order up to ${stockLimitValue} units of ${stockLimitProductName}.`,
      });
    }
    
    if (moqToast) {
      toast({
        variant: "destructive",
        title: "Minimum Order",
        description: `The minimum order for ${moqProductName} is ${moqValue} units.`,
      });
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
