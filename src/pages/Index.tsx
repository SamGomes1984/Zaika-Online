import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, ChefHat, Award, Heart, Loader2, ChevronLeft, ChevronRight, Sparkles, Sandwich, Cookie, Cake, Coffee } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import  CategoryGrid  from '@/components/categories/categories-grid';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from '@/components/layout/PageContainer';
import { ProductFilters } from '@/components/product/ProductFilters';
import { CartPanel } from '@/components/cart/CartPanel';
import { FilterCategory } from '@/types';
import { supabase } from "@/integrations/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Hero images
import heroFitness from '@/assets/hero-fitness.jpg';
import heroGroceries from '@/assets/hero-groceries.jpg';

const heroSlides = [
  {
    title: '30% Off',
    subtitle: 'Featured Baked Goods',
    image: heroFitness,
    bgColor: 'from-primary to-orange-500',
  },
  {
    title: 'Fresh Baked',
    subtitle: 'Daily Delights',
    image: heroGroceries,
    bgColor: 'from-green-500 to-emerald-500',
  },
];

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
  categories?: { name: string; slug: string };
  product_images?: { image_url: string; is_primary: boolean }[];
}

interface Testimonial {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

// Custom Loading Component
const ZaikaLoader = () => {
  const [loadingStage, setLoadingStage] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % 4);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="relative w-64 h-64">
        {/* Central toast */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">ZT</span>
            </div>
            {/* Toast texture */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-4 bg-white rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                    transform: `rotate(${Math.random() * 360}deg)`
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Orbiting ingredients */}
        {[Sandwich, Cookie, Cake, Coffee].map((Icon, index) => (
          <motion.div
            key={index}
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 12 + index * 2, 
              repeat: Infinity, 
              ease: "linear",
              // direction: index % 2 === 0 ? "normal" : "reverse"
            }}
          >
            <motion.div
              className="absolute"
              style={{
                transform: `translateX(80px) rotate(${index * 90}deg)`
              }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                loadingStage === index ? 'bg-orange-500' : 'bg-amber-200'
              }`}>
                <Icon className={`w-5 h-5 ${
                  loadingStage === index ? 'text-white' : 'text-amber-600'
                }`} />
              </div>
            </motion.div>
          </motion.div>
        ))}
        
        {/* Loading text */}
        <div className="absolute -bottom-16 left-0 right-0 text-center">
          <p className="text-orange-600 font-medium">Baking something special...</p>
          <div className="flex justify-center mt-2 space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-orange-400 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const navigate = useNavigate();

  // Mock testimonials
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Priya Sharma",
      rating: 5,
      comment: "The croissants are absolutely divine! Fresh, flaky, and perfectly buttery. Best I've had in the city!",
      date: "2 days ago"
    },
    {
      id: 2,
      name: "Rahul Mehta",
      rating: 5,
      comment: "Amazing quality and taste. The chocolate cake was a hit at our party. Will definitely order again!",
      date: "1 week ago"
    },
    {
      id: 3,
      name: "Ananya Patel",
      rating: 5,
      comment: "Love the variety and freshness. The staff is super friendly and delivery is always on time. Highly recommend!",
      date: "2 weeks ago"
    }
  ];

  // Fetch products by category
  const fetchProductsByCategory = async () => {
    try {
      setLoading(true);
      
      // Fetch featured products
      const { data: featuredData, error: featuredError } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, slug),
          product_images (image_url, is_primary)
        `)
        .eq('is_featured', true)
        .limit(6);

      if (featuredError) throw featuredError;
      setFeaturedProducts(featuredData || []);

      // Fetch new products
      const { data: newData, error: newError } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, slug),
          product_images (image_url, is_primary)
        `)
        .eq('is_new', true)
        .limit(6);

      if (newError) throw newError;
      setNewProducts(newData || []);

      // Fetch popular products (high rated)
      const { data: popularData, error: popularError } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, slug),
          product_images (image_url, is_primary)
        `)
        .gte('rating', 4)
        .order('rating', { ascending: false })
        .limit(6);

      if (popularError) throw popularError;
      setPopularProducts(popularData || []);

    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      // Hide loader after a minimum time to show the animation
      setTimeout(() => setShowLoader(false), 2500);
    }
  };

  useEffect(() => {
    fetchProductsByCategory();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Get primary image or first image
  const getProductImage = (product: Product) => {
    if (product.image_url) return product.image_url;
    const primaryImage = product.product_images?.find(img => img.is_primary);
    if (primaryImage) return primaryImage.image_url;
    return product.product_images?.[0]?.image_url || 'https://via.placeholder.com/400';
  };

  const slide = heroSlides[currentSlide];

  // Component to render product section
  const ProductSection = ({ title, products, viewAllLink, badgeText, badgeColor }: {
    title: string;
    products: Product[];
    viewAllLink: string;
    badgeText?: string;
    badgeColor?: string;
  }) => (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          {badgeText && (
            <Badge className={badgeColor || "bg-accent"}>
              {badgeText}
            </Badge>
          )}
        </div>
        <Link to={viewAllLink}>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={{
                id: product.slug,
                name: product.name,
                price: product.price,
                image: getProductImage(product),
                category: product.categories?.name || 'Uncategorized',
                isNew: product.is_new,
                rating: product.rating || undefined,
                review_count: product.review_count || undefined,
                originalPrice: product.original_price || undefined,
                description: product.description || undefined,
                stock: product.stock_quantity,
              }} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products available in this category.</p>
        </div>
      )}
    </section>
  );

  if (showLoader) {
    return <ZaikaLoader />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="flex flex-col lg:flex-row w-full">
        {/* Main Content */}
        <div className="flex-1 w-full pb-16 lg:pb-0">
          <PageContainer>
            {/* Hero Carousel */}
            <div className="relative mb-2 w-full overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-orange-500 shadow-card-hover">
              <div className="relative flex items-center">
                <div className="flex w-full max-w-full flex-col items-center gap-4 p-4 md:flex-row md:p-12">
                  {/* Mobile Image */}
                  <div className="w-full md:hidden">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-40 w-full max-w-full rounded-2xl object-cover"
                    />
                  </div>
                  
                  {/* Text Content */}
                  <div className="w-full md:w-1/2 lg:flex-1">
                    <h1 className="mb-2 text-2xl font-bold text-primary-foreground md:text-5xl lg:text-6xl">
                      {slide.title}
                    </h1>
                    <p className="text-base font-semibold text-primary-foreground md:text-2xl lg:text-3xl">
                      {slide.subtitle}
                    </p>
                  </div>
                  
                  {/* Desktop Image */}
                  <div className="hidden w-full md:block md:w-1/2">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-56 w-full max-w-full rounded-2xl object-cover lg:h-64"
                    />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'w-6 md:w-8 bg-primary-foreground'
                        : 'w-2 bg-primary-foreground/50'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-primary-foreground/20 text-primary-foreground backdrop-blur-sm hover:bg-primary-foreground/30"
                onClick={() =>
                  setCurrentSlide(
                    (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                  )
                }
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary-foreground/20 text-primary-foreground backdrop-blur-sm hover:bg-primary-foreground/30"
                onClick={() =>
                  setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
                }
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Category Grid (Swiggy Style) */}
<CategoryGrid />

{/* Filters */}
{/* <div className="mb-6">
  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-800 font-medium">Categories</h3>
        <Link to="/products">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
    </div> */}
    
    {/* Filter container with proper spacing */}
    {/* <div className="py-4 overflow-visible">
      <ProductFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
    </div>
  </div>
</div> */}

            {/* Traditional Product Sections */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Featured Products Section */}
                <ProductSection 
                  title="Featured Products" 
                  products={featuredProducts}
                  viewAllLink="/products?filter=featured"
                  badgeColor="bg-orange-500"
                />

                {/* New Products Section */}
                <ProductSection 
                  title="New Arrivals" 
                  products={newProducts}
                  viewAllLink="/products?filter=new"
                  badgeColor="bg-green-500"
                />

                {/* Popular Products Section */}
                <ProductSection 
                  title="Customer Favorites" 
                  products={popularProducts}
                  viewAllLink="/products?filter=popular"
                  badgeColor="bg-purple-500"
                />
              </>
            )}
          </PageContainer>
        </div>

        {/* Cart Panel - Desktop Only */}
        <div className="hidden lg:block lg:w-96 lg:flex-shrink-0 border-l">
          <CartPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;