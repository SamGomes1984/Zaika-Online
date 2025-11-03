import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Plus, Star } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useState } from "react";

// Updated Product interface to match database structure
export interface Product {
  id: string; // This should be the slug for routing
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  rating?: number;
  review_count: number | null;
  description?: string;
  stock?: number;
  shortDescription?: string;
}

export type ProductCardProps =
  | { product: Product }
  | (Product & { onAddToCart?: () => void });

const ProductCard = (props: ProductCardProps) => {
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Support both new and legacy API
  const product: Product | undefined = (props as any).product ?? (props as any);

  if (!product || !product.id) {
    // Defensive: avoid runtime crash if props are incorrect during transitions
    return null;
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if product is out of stock
    if (product.stock !== undefined && product.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: 1,
    });
    
    toast.success(`${product.name} added to cart`);
    
    // Call legacy callback if provided
    if ((props as any).onAddToCart) {
      (props as any).onAddToCart();
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const isOutOfStock = product.stock !== undefined && product.stock === 0;
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/products/${product.id}`} className="block">
      <div
        className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Full product image as background */}
        <div className="relative aspect-square">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Dark overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          
          {/* Rating badge - top left with glass effect */}
          <div 
            className="absolute top-3 left-3 flex items-center gap-1 rounded-full px-3 py-1.5 border border-white/20"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-bold text-white">{product.rating || 4.8}</span>
          </div>
          
          {/* Wishlist button - top right with glass effect */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute right-3 top-3 h-9 w-9 rounded-full border border-white/20 p-0 hover:bg-white/20 transition-all ${
              isWishlisted ? 'text-red-500' : 'text-white'
            }`}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onClick={handleWishlist}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </Button>
          
          {/* Status badges with glass effect */}
          {(product.isNew || discount > 0 || isOutOfStock) && (
            <div className="absolute top-3 right-14 flex flex-col gap-2">

              {isOutOfStock && (
                <Badge 
                  className="bg-red-500/80 text-white border-0"
                  style={{
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  Out of Stock
                </Badge>
              )}
            </div>
          )}
          
          {/* Bottom section with glass morphism - product name and price */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-4 "
            style={{
              background: 'rgba(255, 255, 255, 0)'
            }}
          >
            <div className="flex items-end justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">
                  {product.name}
                </h3>
                <span className="text-xl font-bold text-white">₹{product.price}</span>
              </div>
              
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="h-10 w-10 rounded-full p-0 border border-white/30 hover:bg-white/30 transition-all ml-3 flex-shrink-0"
style={{
  background: 'linear-gradient(135deg, rgba(255, 160, 60, 0.45), rgba(255, 90, 0, 0.35))',
  backdropFilter: 'blur(25px) saturate(200%)',
  WebkitBackdropFilter: 'blur(25px) saturate(200%)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  boxShadow: '0 8px 32px rgba(255, 120, 0, 0.4)',
  borderRadius: '20px',
}}


              >
                <Plus className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;