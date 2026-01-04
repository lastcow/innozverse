'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { ApiClient } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Package,
  DollarSign,
  Tag,
  Star,
  Sparkles,
  X,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductColor {
  id: string;
  product_template_id: string;
  color_name: string;
  hex_code: string | null;
  display_order: number;
  is_active: boolean;
}

interface ProductTemplate {
  id: string;
  category_id: string;
  category?: ProductCategory;
  name: string;
  subtitle: string | null;
  description: string | null;
  weekly_rate: string;
  monthly_rate: string;
  deposit_amount: string;
  specs: Record<string, string> | null;
  screen_size: string | null;
  highlights: string | null;
  includes: string[] | null;
  image_url: string | null;
  is_popular: boolean;
  has_accessories: boolean;
  is_new: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  colors?: ProductColor[];
}

const getCategoryColorClass = (color: string | null) => {
  switch (color) {
    case 'cyan':
      return 'bg-cyan-100 text-cyan-700';
    case 'green':
      return 'bg-green-100 text-green-700';
    case 'orange':
      return 'bg-orange-100 text-orange-700';
    case 'purple':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function ProductsPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Product dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductTemplate | null>(null);
  const [productForm, setProductForm] = useState({
    category_id: '',
    name: '',
    subtitle: '',
    description: '',
    weekly_rate: '',
    monthly_rate: '',
    deposit_amount: '',
    specs: '{}',
    screen_size: '',
    highlights: '',
    includes: '',
    image_url: '',
    is_popular: false,
    has_accessories: false,
    is_new: false,
    is_active: true,
    display_order: 0,
  });

  // Color management state
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductTemplate | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  // Delete state
  const [productToDelete, setProductToDelete] = useState<ProductTemplate | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    popularProducts: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesRes, productsRes] = await Promise.all([
        apiClient.listProductCategories(),
        apiClient.listProducts({ include_colors: true }),
      ]);

      const cats = categoriesRes.data.categories || [];
      const prods = productsRes.data.products || [];

      setCategories(cats);
      setProducts(prods);

      setStats({
        totalProducts: prods.length,
        activeProducts: prods.filter((p: ProductTemplate) => p.is_active).length,
        popularProducts: prods.filter((p: ProductTemplate) => p.is_popular).length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const refreshToken = apiClient.getRefreshToken();
    if (refreshToken) {
      apiClient.refresh().then(() => {
        fetchData();
      }).catch(() => {
        setError('Authentication failed. Please log in again.');
        setLoading(false);
      });
    } else {
      setError('No authentication token found. Please log in.');
      setLoading(false);
    }
  }, [fetchData]);

  // Product handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      category_id: categories[0]?.id || '',
      name: '',
      subtitle: '',
      description: '',
      weekly_rate: '',
      monthly_rate: '',
      deposit_amount: '',
      specs: '{}',
      screen_size: '',
      highlights: '',
      includes: '',
      image_url: '',
      is_popular: false,
      has_accessories: false,
      is_new: false,
      is_active: true,
      display_order: products.length,
    });
    setProductDialogOpen(true);
  };

  const handleEditProduct = (product: ProductTemplate) => {
    setEditingProduct(product);
    setProductForm({
      category_id: product.category_id,
      name: product.name,
      subtitle: product.subtitle || '',
      description: product.description || '',
      weekly_rate: product.weekly_rate,
      monthly_rate: product.monthly_rate,
      deposit_amount: product.deposit_amount,
      specs: JSON.stringify(product.specs || {}, null, 2),
      screen_size: product.screen_size || '',
      highlights: product.highlights || '',
      includes: (product.includes || []).join('\n'),
      image_url: product.image_url || '',
      is_popular: product.is_popular,
      has_accessories: product.has_accessories,
      is_new: product.is_new,
      is_active: product.is_active,
      display_order: product.display_order,
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      let specs = {};
      try {
        specs = JSON.parse(productForm.specs);
      } catch {
        setError('Invalid JSON in specs field');
        return;
      }

      const data = {
        ...productForm,
        specs,
        weekly_rate: parseFloat(productForm.weekly_rate),
        monthly_rate: parseFloat(productForm.monthly_rate),
        deposit_amount: parseFloat(productForm.deposit_amount),
        includes: productForm.includes.split('\n').filter(Boolean),
      };

      if (editingProduct) {
        await apiClient.updateProduct(editingProduct.id, data);
      } else {
        await apiClient.createProduct(data);
      }
      setProductDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await apiClient.deleteProduct(productToDelete.id);
      setProductToDelete(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      setProductToDelete(null);
    }
  };

  // Color handlers
  const handleManageColors = (product: ProductTemplate) => {
    setSelectedProduct(product);
    setNewColorName('');
    setNewColorHex('#000000');
    setColorDialogOpen(true);
  };

  const handleAddColor = async () => {
    if (!selectedProduct || !newColorName) return;
    try {
      await apiClient.addProductColor(selectedProduct.id, {
        color_name: newColorName,
        hex_code: newColorHex,
      });
      setNewColorName('');
      setNewColorHex('#000000');
      fetchData();
      // Update selected product with new colors
      const updated = await apiClient.getProduct(selectedProduct.id);
      setSelectedProduct(updated.data.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add color');
    }
  };

  const handleDeleteColor = async (colorId: string) => {
    if (!selectedProduct) return;
    try {
      await apiClient.deleteProductColor(selectedProduct.id, colorId);
      fetchData();
      // Update selected product with remaining colors
      const updated = await apiClient.getProduct(selectedProduct.id);
      setSelectedProduct(updated.data.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete color');
    }
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-1">
              Manage product templates for rentals.
            </p>
          </div>
          <Button
            onClick={handleAddProduct}
            className="rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalProducts}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold mt-1">{stats.activeProducts}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Popular Products</p>
                  <p className="text-2xl font-bold mt-1">{stats.popularProducts}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Products Table */}
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No products found. Add your first product to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Product</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Category</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Pricing</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Colors</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Flags</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                      <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const category = categories.find(c => c.id === product.category_id);
                      return (
                        <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white flex-shrink-0">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                {product.subtitle && (
                                  <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {product.subtitle}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {category ? (
                              <span className={`px-2 py-1 rounded text-xs ${getCategoryColorClass(category.color)}`}>
                                {category.name}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-4">
                            <div className="text-xs space-y-0.5">
                              <div><span className="font-medium">{formatCurrency(product.weekly_rate)}</span>/wk</div>
                              <div><span className="font-medium">{formatCurrency(product.monthly_rate)}</span>/mo</div>
                              <div className="text-muted-foreground">{formatCurrency(product.deposit_amount)} deposit</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleManageColors(product)}
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {product.colors?.length || 0} colors
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              {product.is_popular && (
                                <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700" title="Popular">
                                  <Star className="h-3 w-3" />
                                </span>
                              )}
                              {product.is_new && (
                                <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700" title="New">
                                  <Sparkles className="h-3 w-3" />
                                </span>
                              )}
                              {product.has_accessories && (
                                <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700" title="Has Accessories">
                                  +
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              product.is_active
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                                className="h-8 w-8"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setProductToDelete(product)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Dialog */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update the product template details.' : 'Create a new product template.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Surface Pro 9"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  value={productForm.subtitle}
                  onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                  placeholder="13-inch touchscreen with Intel Core i5"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Full product description..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Weekly Rate *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.weekly_rate}
                      onChange={(e) => setProductForm({ ...productForm, weekly_rate: e.target.value })}
                      placeholder="49.99"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Monthly Rate *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.monthly_rate}
                      onChange={(e) => setProductForm({ ...productForm, monthly_rate: e.target.value })}
                      placeholder="149.99"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Deposit *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.deposit_amount}
                      onChange={(e) => setProductForm({ ...productForm, deposit_amount: e.target.value })}
                      placeholder="200.00"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Screen Size</label>
                  <Input
                    value={productForm.screen_size}
                    onChange={(e) => setProductForm({ ...productForm, screen_size: e.target.value })}
                    placeholder="13"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Image URL</label>
                  <Input
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Specs (JSON)</label>
                <textarea
                  value={productForm.specs}
                  onChange={(e) => setProductForm({ ...productForm, specs: e.target.value })}
                  placeholder='{"processor": "Intel Core i5", "ram": "8GB", "storage": "256GB"}'
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Highlights</label>
                <Input
                  value={productForm.highlights}
                  onChange={(e) => setProductForm({ ...productForm, highlights: e.target.value })}
                  placeholder="Perfect for students and professionals"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Includes (one per line)</label>
                <textarea
                  value={productForm.includes}
                  onChange={(e) => setProductForm({ ...productForm, includes: e.target.value })}
                  placeholder="Power adapter&#10;USB-C cable&#10;Quick start guide"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_popular}
                    onChange={(e) => setProductForm({ ...productForm, is_popular: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_new}
                    onChange={(e) => setProductForm({ ...productForm, is_new: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">New</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.has_accessories}
                    onChange={(e) => setProductForm({ ...productForm, has_accessories: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Has Accessories</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveProduct}
                disabled={!productForm.name || !productForm.category_id || !productForm.weekly_rate || !productForm.monthly_rate || !productForm.deposit_amount}
              >
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Color Management Dialog */}
        <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Manage Colors</DialogTitle>
              <DialogDescription>
                Add or remove color options for {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Existing colors */}
              {selectedProduct?.colors && selectedProduct.colors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Colors</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map((color) => (
                      <div
                        key={color.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full"
                      >
                        <div
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: color.hex_code || '#ccc' }}
                        />
                        <span className="text-sm">{color.color_name}</span>
                        <button
                          onClick={() => handleDeleteColor(color.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new color */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add New Color</label>
                <div className="flex gap-2">
                  <Input
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Color name (e.g., Platinum)"
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Button
                    onClick={handleAddColor}
                    disabled={!newColorName}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setColorDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Product Confirmation */}
        <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold">{productToDelete?.name}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProduct}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Product
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
