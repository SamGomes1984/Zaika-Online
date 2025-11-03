import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase";
import { toast } from "sonner";
import { formatCurrency } from '@/utils/formatCurrency';

interface ProductLimits {
  slug: string;
  stock_quantity: number;
  min_order_quantity: number;
  max_order_quantity: number | null;
}

// CartItem component for individual cart items
const CartItem = ({ item, limits, onQuantityChange, onRemove }) => {
  const isOutOfStock = limits.stock === 0;
  const exceedsStock = item.quantity > limits.stock;

  return (
    <div className="flex gap-4">
      <div className="relative">
        <img
          src={item.image}
          alt={item.name}
          className={`w-24 h-24 object-cover rounded-lg ${isOutOfStock ? 'opacity-50' : ''}`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <span className="text-white text-xs font-semibold">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
        <p className="text-lg font-bold text-primary">
          {formatCurrency(item.price * item.quantity)}
        </p>
        
        {/* Stock warnings */}
        {exceedsStock && !isOutOfStock && (
          <p className="text-xs text-destructive mt-1">
            Only {limits.stock} available in stock
          </p>
        )}
        {limits.stock > 0 && limits.stock <= 10 && !exceedsStock && (
          <p className="text-xs text-orange-500 mt-1">
            Only {limits.stock} left in stock
          </p>
        )}
        {limits.min > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            Min order: {limits.min}
          </p>
        )}
      </div>
      
      <div className="flex flex-col items-end justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              disabled={isOutOfStock}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              disabled={isOutOfStock || item.quantity >= limits.max}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {item.quantity >= limits.max && (
            <p className="text-xs text-muted-foreground">
              Max: {limits.max}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, total: subtotal } = useCart();
  const [productLimits, setProductLimits] = useState<Map<string, ProductLimits>>(new Map());
  const [loading, setLoading] = useState(true);
  
  const deliveryCharge = subtotal > 500 ? 0 : 50;
  const total = subtotal + deliveryCharge;

  // Fetch product limits and stock for all cart items
  useEffect(() => {
    const fetchProductLimits = async () => {
      if (items.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const slugs = items.map(item => item.id);
        const { data, error } = await supabase
          .from('products')
          .select('slug, stock_quantity, min_order_quantity, max_order_quantity')
          .in('slug', slugs);

        if (error) throw error;

        const limitsMap = new Map<string, ProductLimits>();
        data?.forEach(product => {
          limitsMap.set(product.slug, product);
        });
        
        setProductLimits(limitsMap);
      } catch (error) {
        console.error('Error fetching product limits:', error);
        toast.error('Failed to load product information');
      } finally {
        setLoading(false);
      }
    };

    fetchProductLimits();
  }, [items.length]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const limits = productLimits.get(itemId);
    
    if (!limits) {
      updateQuantity(itemId, newQuantity);
      return;
    }

    const min = limits.min_order_quantity || 1;
    const max = limits.max_order_quantity || limits.stock_quantity || 999;
    
    // Check minimum
    if (newQuantity < min) {
      if (newQuantity === 0) {
        // Allow removal via updateQuantity
        updateQuantity(itemId, 0);
      } else {
        toast.error(`Minimum order quantity is ${min}`);
      }
      return;
    }
    
    // Check maximum
    if (newQuantity > max) {
      toast.error(`Maximum order quantity is ${max}`);
      return;
    }
    
    // Check stock
    if (newQuantity > limits.stock_quantity) {
      toast.error(`Only ${limits.stock_quantity} items available in stock`);
      return;
    }
    
    updateQuantity(itemId, newQuantity);
  };

  const getItemLimits = (itemId: string) => {
    const limits = productLimits.get(itemId);
    return {
      min: limits?.min_order_quantity || 1,
      max: limits?.max_order_quantity || limits?.stock_quantity || 999,
      stock: limits?.stock_quantity || 0,
    };
  };

  if (items.length === 0) {
    return (
      <PageContainer>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <ShoppingCart className="mb-4 h-24 w-24 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Your cart is empty</h2>
          <p className="mb-6 text-muted-foreground">
            Add some delicious items to get started
          </p>
          <Button size="lg" onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="mb-6 text-3xl font-bold">Shopping Cart</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="space-y-4">
            {items.map((item) => {
              const limits = getItemLimits(item.id);
              const isOutOfStock = limits.stock === 0;
              const exceedsStock = item.quantity > limits.stock;
              
              return (
                <div key={item.id}>
                  <div className={isOutOfStock || exceedsStock ? 'border border-destructive rounded-lg p-4' : ''}>
                    <CartItem 
                      item={item}
                      limits={limits}
                      onQuantityChange={handleQuantityChange}
                      onRemove={removeItem}
                    />
                  </div>
                  <Separator className="mt-4" />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="h-fit p-6">
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-medium">
                {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
              </span>
            </div>
            {subtotal > 0 && subtotal < 500 && (
              <p className="text-xs text-muted-foreground">
                Add {formatCurrency(500 - subtotal)} more for free delivery
              </p>
            )}
          </div>

          <Separator className="my-4" />

          <div className="mb-4 flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Cart;