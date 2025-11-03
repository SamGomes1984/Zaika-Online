import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  category_id: string | null;
  description: string | null;
  original_price: number | null;
  sku: string | null;
  stock_quantity: number | null;
  min_order_quantity: number | null;
  max_order_quantity: number | null;
  is_featured: boolean;
  is_new: boolean;
  is_available: boolean;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
  created_at: string;
  categories?: { name: string };
  product_images?: { id: string; image_url: string; display_order: number; is_primary: boolean }[];
  product_ingredients?: { ingredient_id: string }[];
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    original_price: '',
    category_id: '',
    description: '',
    sku: '',
    stock_quantity: '',
    min_order_quantity: '1',
    max_order_quantity: '10',
    is_featured: false,
    is_new: false,
    is_available: true,
    rating: '',
    review_count: '0',
  });

  const [additionalImages, setAdditionalImages] = useState<string[]>(['']);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          product_images (id, image_url, display_order, is_primary),
          product_ingredients (ingredient_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch ingredients
  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchIngredients();
  }, []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle name change and auto-generate slug
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  // Open dialog for adding new product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      slug: '',
      price: '',
      original_price: '',
      category_id: '',
      description: '',
      sku: '',
      stock_quantity: '',
      min_order_quantity: '1',
      max_order_quantity: '10',
      is_featured: false,
      is_new: false,
      is_available: true,
      rating: '',
      review_count: '0',
    });
    setAdditionalImages(['']);
    setSelectedIngredients([]);
    setIsDialogOpen(true);
  };

  // Open dialog for editing product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category_id: product.category_id || '',
      description: product.description || '',
      sku: product.sku || '',
      stock_quantity: product.stock_quantity?.toString() || '',
      min_order_quantity: product.min_order_quantity?.toString() || '1',
      max_order_quantity: product.max_order_quantity?.toString() || '10',
      is_featured: product.is_featured,
      is_new: product.is_new,
      is_available: product.is_available,
      rating: product.rating?.toString() || '',
      review_count: product.review_count?.toString() || '0',
    });

    // Set additional images
    const images = product.product_images?.map(img => img.image_url) || [];
    setAdditionalImages(images.length > 0 ? images : ['']);

    // Set selected ingredients
    const ingredientIds = product.product_ingredients?.map(pi => pi.ingredient_id) || [];
    setSelectedIngredients(ingredientIds);

    setIsDialogOpen(true);
  };

  // Add image URL field
  const addImageField = () => {
    setAdditionalImages([...additionalImages, '']);
  };

  // Remove image URL field
  const removeImageField = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  // Update image URL
  const updateImageUrl = (index: number, value: string) => {
    const newImages = [...additionalImages];
    newImages[index] = value;
    setAdditionalImages(newImages);
  };

  // Toggle ingredient selection
  const toggleIngredient = (ingredientId: string) => {
    if (selectedIngredients.includes(ingredientId)) {
      setSelectedIngredients(selectedIngredients.filter(id => id !== ingredientId));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredientId]);
    }
  };

  // Save product
  const handleSaveProduct = async () => {
    if (!formData.name.trim() || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    setIsSaving(true);

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id || null,
        description: formData.description || null,
        sku: formData.sku || null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        min_order_quantity: formData.min_order_quantity ? parseInt(formData.min_order_quantity) : 1,
        max_order_quantity: formData.max_order_quantity ? parseInt(formData.max_order_quantity) : 10,
        is_featured: formData.is_featured,
        is_new: formData.is_new,
        is_available: formData.is_available,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        review_count: formData.review_count ? parseInt(formData.review_count) : 0,
        image_url: additionalImages[0] || null,
      };

      let productId: string;

      if (selectedProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', selectedProduct.id);

        if (error) throw error;
        productId = selectedProduct.id;

        // Delete existing images and ingredients
        await supabase.from('product_images').delete().eq('product_id', productId);
        await supabase.from('product_ingredients').delete().eq('product_id', productId);

        toast.success('Product updated successfully');
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
        toast.success('Product created successfully');
      }

      // Insert product images
      const imageInserts = additionalImages
        .filter(url => url.trim())
        .map((url, index) => ({
          product_id: productId,
          image_url: url,
          display_order: index,
          is_primary: index === 0,
        }));

      if (imageInserts.length > 0) {
        await supabase.from('product_images').insert(imageInserts);
      }

      // Insert product ingredients
      const ingredientInserts = selectedIngredients.map(ingredientId => ({
        product_id: productId,
        ingredient_id: ingredientId,
      }));

      if (ingredientInserts.length > 0) {
        await supabase.from('product_ingredients').insert(ingredientInserts);
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error.code === '23505') {
        toast.error('A product with this name or slug already exists');
      } else {
        toast.error('Failed to save product');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      toast.success('Product deleted successfully');
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Products</h1>
          <p className="text-muted-foreground mt-2">Manage your product catalog</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search products..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <img
                  src={product.image_url || 'https://via.placeholder.com/80'}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.categories?.name || 'No category'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Stock: {product.stock_quantity ?? 'N/A'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {product.is_new && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        New
                      </span>
                    )}
                    {product.is_featured && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                    {!product.is_available && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">₹{product.price}</p>
                  {product.original_price && (
                    <p className="text-sm text-muted-foreground line-through">
                      ₹{product.original_price}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setProductToDelete(product);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? 'Update the product details below'
                : 'Create a new product for your catalog'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Chocolate Croissant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="chocolate-croissant"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="99.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="original_price">Original Price (₹)</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  placeholder="149.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
              />
            </div>

            {/* Inventory */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="PROD-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_order">Min Order</Label>
                <Input
                  id="min_order"
                  type="number"
                  value={formData.min_order_quantity}
                  onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_order">Max Order</Label>
                <Input
                  id="max_order"
                  type="number"
                  value={formData.max_order_quantity}
                  onChange={(e) => setFormData({ ...formData, max_order_quantity: e.target.value })}
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Product Images</Label>
                <Button type="button" variant="outline" size="sm" onClick={addImageField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </div>
              {additionalImages.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    placeholder="Image URL"
                  />
                  {additionalImages.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeImageField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                <Label>Ingredients</Label>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {ingredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`ingredient-${ingredient.id}`}
                        checked={selectedIngredients.includes(ingredient.id)}
                        onChange={() => toggleIngredient(ingredient.id)}
                        className="rounded"
                      />
                      <label
                        htmlFor={`ingredient-${ingredient.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {ingredient.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="4.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_count">Review Count</Label>
                <Input
                  id="review_count"
                  type="number"
                  value={formData.review_count}
                  onChange={(e) => setFormData({ ...formData, review_count: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_available">Available</Label>
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_available: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_featured">Featured</Label>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_new">New Product</Label>
                <Switch
                  id="is_new"
                  checked={formData.is_new}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_new: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;