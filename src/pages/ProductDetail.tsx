import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase";
import { toast } from "sonner";

interface Ingredient {
  id: string;
  name: string;
  is_allergen: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  description: string | null;
  image_url: string | null;
  is_new: boolean;
  is_featured: boolean;
  is_available: boolean;
  rating: number | null;
  review_count: number | null;
  category_id: string | null;
  stock_quantity: number;
  min_order_quantity: number;
  max_order_quantity: number | null;
  categories?: { name: string; slug: string };
  product_images?: { image_url: string; is_primary: boolean; display_order: number }[];
  product_ingredients?: { ingredients: Ingredient }[];
}

const ProductDetail = () => {
  const { id: slug } = useParams(); // This is actually the slug from the URL
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  // Fetch product by slug
  const fetchProduct = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, slug),
          product_images (image_url, is_primary, display_order),
          product_ingredients (
            ingredients (id, name, is_allergen)
          )
        `)
        .eq('slug', slug)
        .eq('is_available', true)
        .single();

      if (error) throw error;
      setProduct(data);

      // Set initial quantity to min_order_quantity
      if (data?.min_order_quantity) {
        setQuantity(data.min_order_quantity);
      }

      // Fetch related products
      if (data?.category_id) {
        const { data: related, error: relatedError } = await supabase
          .from('products')
          .select(`
            *,
            categories (name, slug),
            product_images (image_url, is_primary, display_order)
          `)
          .eq('category_id', data.category_id)
          .eq('is_available', true)
          .neq('id', data.id)
          .limit(4);

        if (!relatedError && related) {
          setRelatedProducts(related);
        }
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  // Get primary image or first image
  const getProductImage = (prod: Product) => {
    if (prod.image_url) return prod.image_url;
    
    if (prod.product_images && prod.product_images.length > 0) {
      const sortedImages = [...prod.product_images].sort((a, b) => a.display_order - b.display_order);
      const primaryImage = sortedImages.find(img => img.is_primary);
      if (primaryImage) return primaryImage.image_url;
      return sortedImages[0].image_url;
    }
    
    return 'https://via.placeholder.com/400';
  };

  // Get all product images
  const getAllProductImages = () => {
    if (!product) return [];
    
    const images: string[] = [];
    
    if (product.image_url) {
      images.push(product.image_url);
    }
    
    if (product.product_images && product.product_images.length > 0) {
      const sortedImages = [...product.product_images].sort((a, b) => a.display_order - b.display_order);
      sortedImages.forEach(img => {
        if (!images.includes(img.image_url)) {
          images.push(img.image_url);
        }
      });
    }
    
    return images.length > 0 ? images : ['https://via.placeholder.com/400'];
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check stock
    if (product.stock_quantity < quantity) {
      toast.error('Not enough stock available');
      return;
    }

    addItem({
      id: product.slug,
      name: product.name,
      price: product.price,
      image: getProductImage(product),
      category: product.categories?.name || 'Uncategorized',
      quantity: quantity,
    });

    toast.success(`Added ${quantity} ${product.name} to cart`);
    setQuantity(product.min_order_quantity);
  };

  const handleQuantityChange = (newQuantity: number) => {
    const min = product?.min_order_quantity || 1;
    const max = product?.max_order_quantity || product?.stock_quantity || 999;
    
    if (newQuantity < min) {
      setQuantity(min);
      return;
    }
    
    if (newQuantity > max) {
      toast.error(`Maximum order quantity is ${max}`);
      setQuantity(max);
      return;
    }
    
    setQuantity(newQuantity);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or is no longer available.
          </p>
          <Link to="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const productImages = getAllProductImages();
  const ingredients = product.product_ingredients?.map(pi => pi.ingredients) || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/products">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={productImages[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.is_new && (
              <Badge className="absolute top-4 right-4 bg-accent">New</Badge>
            )}
            {product.stock_quantity === 0 && (
              <Badge className="absolute top-4 left-4 bg-destructive">Out of Stock</Badge>
            )}
          </div>

          {/* Thumbnail Images */}
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {productImages.slice(1, 5).map((img, idx) => (
                <div key={idx} className="aspect-square rounded-md overflow-hidden border">
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground uppercase mb-2">
              {product.categories?.name || 'Uncategorized'}
            </p>
            <h1 className="text-4xl font-display font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-2">
              <p className="text-3xl font-bold text-primary">₹{product.price}</p>
              {product.original_price && product.original_price > product.price && (
                <p className="text-xl text-muted-foreground line-through">
                  ₹{product.original_price}
                </p>
              )}
            </div>

            {product.rating && product.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(product.rating!) ? "text-yellow-400" : "text-gray-300"}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.review_count || 0} reviews)
                </span>
              </div>
            )}

            {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
              <p className="text-sm text-orange-500 mt-2">
                Only {product.stock_quantity} left in stock!
              </p>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {ingredients.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Ingredients:</h3>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient) => (
                  <Badge 
                    key={ingredient.id} 
                    variant={ingredient.is_allergen ? "secondary" : "secondary"}
                  >
                    {ingredient.name}
                    {ingredient.is_allergen && ""}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-semibold">Quantity:</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={product.stock_quantity === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={product.stock_quantity === 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {product.min_order_quantity > 1 && (
                <span className="text-sm text-muted-foreground">
                  Min: {product.min_order_quantity}
                </span>
              )}
            </div>

            <Button 
              size="lg" 
              className="w-full md:w-auto" 
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-3xl font-display font-bold mb-6">
            Related <span className="text-accent">Products</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard 
                key={relatedProduct.id} 
                product={{
                  id: relatedProduct.slug,
                  name: relatedProduct.name,
                  price: relatedProduct.price,
                  image: getProductImage(relatedProduct),
                  category: relatedProduct.categories?.name || 'Uncategorized',
                  isNew: relatedProduct.is_new,
                  rating: relatedProduct.rating || undefined,
                  originalPrice: relatedProduct.original_price || undefined,
                  description: relatedProduct.description || undefined,
                  stock: relatedProduct.stock_quantity,
                }} 
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;