import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase";
import { cn } from "@/lib/utils";
import ProductCard, { Product } from "@/components/ProductCard";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  product_count?: number;
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  
  // State for products and categories
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // State for filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  
  // State for mobile filters
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  // Fetch products with filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select(`
            *,
            categories (name, slug),
            product_images (image_url, is_primary)
          `, { count: 'exact' });

        // Apply category filter
        if (selectedCategory !== 'all') {
          query = query.eq('category_id', selectedCategory);
        }

        // Apply price filter
        query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);

        // Apply sorting
        switch (sortBy) {
          case 'price-low-high':
            query = query.order('price', { ascending: true });
            break;
          case 'price-high-low':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'featured':
          default:
            query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
            break;
        }

        // Apply pagination
        const from = (currentPage - 1) * productsPerPage;
        const to = from + productsPerPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;
        
        // Transform data to match Product interface
        const transformedProducts: Product[] = (data || []).map(item => ({
          id: item.slug,
          name: item.name,
          price: item.price,
          originalPrice: item.original_price,
          image: item.image_url || item.product_images?.find(img => img.is_primary)?.image_url || 'https://via.placeholder.com/400',
          category: item.categories?.name || 'Uncategorized',
          isNew: item.is_new,
          rating: item.rating || undefined,
          review_count: item.review_count,
          description: item.description,
          stock: item.stock_quantity,
        }));
        
        setProducts(transformedProducts);
        setTotalProducts(count || 0);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, priceRange, sortBy, currentPage]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [selectedCategory, currentPage, setSearchParams]);

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Sidebar - Categories (Fixed 15% on all screens) */}
      <aside className="w-[20%] bg-white border-r border-gray-200 flex flex-col h-full">
        
        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-2 lg:p-4">
          <nav className="space-y-1">
            {/* All Categories */}
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              className="w-full justify-center text-xs lg:text-sm h-8 lg:h-10 px-2 lg:px-3"
              onClick={() => handleCategoryChange('all')}
            >
              <span className="truncate">All</span>
            </Button>
            
            {/* Category List */}
            {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className="cursor-pointer flex flex-col items-center justify-center snap-start transition-transform duration-200 hover:scale-105"
            >
              <img
                src={category.image_url || "https://via.placeholder.com/100"}
                alt={category.name}
                className="object-contain w-20 h-20"
                style={{ maxWidth: "80%", maxHeight: "80%" }}
              />
<p className="text-[12px] text-gray-700 font-medium text-center mt-[-10px] mb-3 leading-[1]">
  {category.name}
</p>

            </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content - Products (Fixed 85% on all screens) */}
      <main className="w-[85%] flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-3 lg:px-6 py-2 lg:py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">
                {selectedCategory === 'all' 
                  ? 'All Products' 
                  : categories.find(c => c.id === selectedCategory)?.name || 'Products'
                }
              </h1>
              <p className="text-xs lg:text-sm text-gray-500">
                Showing {products.length} of {totalProducts} products
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-32 lg:w-48 h-8 lg:h-10">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
              
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none h-8 lg:h-10 w-8 lg:w-10 p-0"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-3 lg:h-4 w-3 lg:w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none h-8 lg:h-10 w-8 lg:w-10 p-0"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3 lg:h-4 w-3 lg:w-4" />
                </Button>
              </div>
              
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 px-2"
                onClick={() => setShowMobileFilters(true)}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Bar - Desktop */}
        <div className="hidden lg:block bg-gray-50 border-b border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filters:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Price:</span>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={1000}
                step={10}
                className="w-32"
              />
              <span className="text-sm text-gray-600">
                ₹{priceRange[0]} - ₹{priceRange[1]}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory('all');
                setPriceRange([0, 1000]);
                setSortBy('featured');
                setCurrentPage(1);
              }}
            >
              Clear all
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-2 lg:p-6 overflow-y-auto">
          {/* Loading State */}
          {loading ? (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-6" 
                : "space-y-4"
            )}>
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse"></div>
                  <CardContent className="p-2 lg:p-4">
                    <div className="h-3 lg:h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-3 lg:h-4 bg-gray-200 animate-pulse rounded w-3/4 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-5 lg:h-6 bg-gray-200 animate-pulse rounded w-1/2"></div>
                      <div className="h-6 lg:h-8 bg-gray-200 animate-pulse rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 lg:py-12 bg-white rounded-lg">
              <p className="text-gray-500 mb-4 text-sm lg:text-base">No products found matching your criteria.</p>
              <Button 
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setPriceRange([0, 1000]);
                  setSortBy('featured');
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Products Grid/List */}
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-6" 
                  : "space-y-4"
              )}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center mt-4 lg:mt-8 space-x-1 lg:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="h-8 lg:h-10 px-2 lg:px-4 text-xs lg:text-sm"
                  >
                    Previous
                  </Button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                      className="h-8 lg:h-10 w-8 lg:w-10 p-0 text-xs lg:text-sm"
                    >
                      {i + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="h-8 lg:h-10 px-2 lg:px-4 text-xs lg:text-sm"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="relative flex flex-col w-full max-w-sm bg-white h-full ml-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileFilters(false)}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Price Range */}
              <div>
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="space-y-4">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedCategory('all');
                  setPriceRange([0, 1000]);
                  setSortBy('featured');
                  setCurrentPage(1);
                }}
              >
                Clear all
              </Button>
              <Button
                className="w-full"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;