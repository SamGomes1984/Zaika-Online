import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

export interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    quantity: number;
  };
  productLimits?: {
    min: number;
    max: number;
    stock: number;
  };
  onQuantityChange?: (itemId: string, newQuantity: number) => void;
}

export function CartItem({ item, productLimits, onQuantityChange }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  
  // Use provided limits or default values
  const limits = productLimits || {
    min: 1,
    max: 999,
    stock: 999
  };
  
  const isOutOfStock = limits.stock === 0;
  const exceedsStock = item.quantity > limits.stock;

  const handleQuantityChange = (newQuantity: number) => {
    if (onQuantityChange) {
      onQuantityChange(item.id, newQuantity);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <Card className={isOutOfStock || exceedsStock ? 'border-destructive' : ''}>
      <CardContent className="p-6">
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
            <Link to={`/products/${item.id}`}>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                {item.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mb-2">
              {item.category}
            </p>
            <p className="text-lg font-bold text-primary">
              ₹{(item.price * item.quantity).toFixed(2)}
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
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
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
                  onClick={() => handleQuantityChange(item.quantity + 1)}
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
      </CardContent>
    </Card>
  );
}