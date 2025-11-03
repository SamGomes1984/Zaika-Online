import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase';

export interface CartItem {
  id: string; // This is the product slug for routing
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  total: number;
  itemCount: number;
  processOrder: (orderId: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
        setItems([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantityToAdd = item.quantity || 1;
    
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
        );
      } else {
        // Add new item with specified quantity
        return [...prevItems, { 
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category,
          quantity: quantityToAdd 
        }];
      }
    });
    
    toast.success(`${item.name} added to cart`);
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
    toast.success('Cart cleared');
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Process order: Decrease stock quantities for all cart items using RPC
  const processOrder = async (orderId: string): Promise<boolean> => {
    try {
      // Prepare order items data for RPC call
      const orderItems = items.map(item => ({
        product_slug: item.id,
        quantity: item.quantity,
      }));

      console.log('Processing order with items:', orderItems);

      // Call the RPC function to update stock
      const { data, error } = await supabase.rpc('process_order_stock_update', {
        order_items: orderItems
      });

      if (error) {
        console.error('RPC Error:', error);
        toast.error('Failed to update stock quantities');
        return false;
      }

      console.log('RPC Response:', data);

      // Check if the operation was successful
      if (!data.success) {
        console.error('Stock update failed:', data.error);
        toast.error(data.error || 'Failed to update stock quantities');
        return false;
      }

      console.log(`Successfully updated stock for ${data.updated_count} products`);
      return true;
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order');
      return false;
    }
  };

  const total = getTotalPrice();
  const itemCount = getTotalItems();

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        total,
        itemCount,
        processOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};