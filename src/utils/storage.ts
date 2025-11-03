import { Cart, Address, Order } from '@/types';

const CART_KEY = 'foodmarket_cart';
const USER_KEY = 'foodmarket_user';
const ADDRESSES_KEY = 'foodmarket_addresses';
const ORDERS_KEY = 'foodmarket_orders';

export const storage = {
  getCart(): Cart | null {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCart(cart: Cart): void {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart', error);
    }
  },

  clearCart(): void {
    try {
      localStorage.removeItem(CART_KEY);
    } catch (error) {
      console.error('Failed to clear cart', error);
    }
  },

  getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser(user: any): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user', error);
    }
  },

  clearUser(): void {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Failed to clear user', error);
    }
  },

  getAddresses(): Address[] {
    try {
      const data = localStorage.getItem(ADDRESSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setAddresses(addresses: Address[]): void {
    try {
      localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Failed to save addresses', error);
    }
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(ORDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setOrders(orders: Order[]): void {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Failed to save orders', error);
    }
  },
};
