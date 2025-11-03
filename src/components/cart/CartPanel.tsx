import { MapPin, Clock, Ticket, X, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { CartItem } from './CartItem';
import { useState } from 'react';

export function CartPanel() {
  const navigate = useNavigate();
  // Fixed: Use 'total' directly from the cart context
  const { items, total, addItem, removeItem, updateQuantity } = useCart();
  const [couponCode, setCouponCode] = useState('');

  const subtotal = total; // Use total directly from cart context
  const deliveryCharge = subtotal > 500 ? 0 : 50;
  const finalTotal = subtotal + deliveryCharge;

  if (items.length === 0) {
    return (
      <Card className="sticky top-20 h-fit p-6">
        <CardContent className="pt-6">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-semibold mb-2 text-center">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6 text-center">
            Start adding some delicious items to your cart!
          </p>
          <Link to="/products">
            <Button className="w-full">Browse Products</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-20 h-fit p-6">
      <CardContent className="p-0">
        <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

        <div className="mb-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Charge</span>
            <span className="font-medium">
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
            </span>
          </div>
          {subtotal > 0 && subtotal < 500 && (
            <p className="text-xs text-muted-foreground">
              Add ₹{(500 - subtotal).toFixed(2)} more for free delivery
            </p>
          )}
        </div>

        {/* <Separator className="my-4" />

        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" className="gap-2">
            <Ticket className="h-4 w-4" />
            Apply
          </Button>
        </div> */}

        <Separator className="my-4" />

        <div className="mb-4 flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">₹{finalTotal.toFixed(2)}</span>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="w-full mb-2"
            size="lg"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </Button>
          <Link to="/products">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}