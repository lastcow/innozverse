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
  Keyboard,
  Mouse,
  Headphones,
  Layers,
  DollarSign,
  Link as LinkIcon,
  X,
  Package,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface AccessoryColor {
  id: string;
  accessory_id: string;
  color_name: string;
  hex_code: string | null;
  display_order: number;
  is_active: boolean;
}

interface Accessory {
  id: string;
  name: string;
  description: string | null;
  weekly_rate: string;
  monthly_rate: string;
  deposit_amount: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  colors?: AccessoryColor[];
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductTemplate {
  id: string;
  name: string;
  category_id: string;
  screen_size: string | null;
}

interface AccessoryLink {
  id: string;
  product_template_id: string | null;
  category_id: string | null;
  accessory_id: string;
  screen_size_filter: string | null;
  is_active: boolean;
  product?: ProductTemplate;
  category?: ProductCategory;
}

const getAccessoryIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('keyboard')) return Keyboard;
  if (lowerName.includes('mouse')) return Mouse;
  if (lowerName.includes('headset') || lowerName.includes('headphone')) return Headphones;
  return Layers;
};

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accessory dialog state
  const [accessoryDialogOpen, setAccessoryDialogOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [accessoryForm, setAccessoryForm] = useState({
    name: '',
    description: '',
    weekly_rate: '',
    monthly_rate: '',
    deposit_amount: '',
    image_url: '',
    is_active: true,
    display_order: 0,
  });

  // Color management state
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  // Link management state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [accessoryForLinks, setAccessoryForLinks] = useState<Accessory | null>(null);
  const [accessoryLinks, setAccessoryLinks] = useState<AccessoryLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [newLinkType, setNewLinkType] = useState<'product' | 'category'>('product');
  const [newLinkProductId, setNewLinkProductId] = useState('');
  const [newLinkCategoryId, setNewLinkCategoryId] = useState('');
  const [newLinkScreenSize, setNewLinkScreenSize] = useState('');

  // Delete state
  const [accessoryToDelete, setAccessoryToDelete] = useState<Accessory | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalAccessories: 0,
    activeAccessories: 0,
    totalColors: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [accessoriesRes, categoriesRes, productsRes] = await Promise.all([
        apiClient.listAdminAccessories({ include_colors: true }),
        apiClient.listProductCategories(),
        apiClient.listProducts({}),
      ]);

      const accs = accessoriesRes.data.accessories || [];
      setAccessories(accs);
      setCategories(categoriesRes.data.categories || []);
      setProducts(productsRes.data.products || []);

      const totalColors = accs.reduce((sum: number, acc: Accessory) => sum + (acc.colors?.length || 0), 0);

      setStats({
        totalAccessories: accs.length,
        activeAccessories: accs.filter((a: Accessory) => a.is_active).length,
        totalColors,
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

  // Accessory handlers
  const handleAddAccessory = () => {
    setEditingAccessory(null);
    setAccessoryForm({
      name: '',
      description: '',
      weekly_rate: '',
      monthly_rate: '',
      deposit_amount: '',
      image_url: '',
      is_active: true,
      display_order: accessories.length,
    });
    setAccessoryDialogOpen(true);
  };

  const handleEditAccessory = (accessory: Accessory) => {
    setEditingAccessory(accessory);
    setAccessoryForm({
      name: accessory.name,
      description: accessory.description || '',
      weekly_rate: accessory.weekly_rate,
      monthly_rate: accessory.monthly_rate,
      deposit_amount: accessory.deposit_amount,
      image_url: accessory.image_url || '',
      is_active: accessory.is_active,
      display_order: accessory.display_order,
    });
    setAccessoryDialogOpen(true);
  };

  const handleSaveAccessory = async () => {
    try {
      const data = {
        ...accessoryForm,
        weekly_rate: parseFloat(accessoryForm.weekly_rate),
        monthly_rate: parseFloat(accessoryForm.monthly_rate),
        deposit_amount: parseFloat(accessoryForm.deposit_amount),
      };

      if (editingAccessory) {
        await apiClient.updateAccessory(editingAccessory.id, data);
      } else {
        await apiClient.createAccessory(data);
      }
      setAccessoryDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save accessory');
    }
  };

  const handleDeleteAccessory = async () => {
    if (!accessoryToDelete) return;
    try {
      await apiClient.deleteAccessory(accessoryToDelete.id);
      setAccessoryToDelete(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete accessory');
      setAccessoryToDelete(null);
    }
  };

  // Color handlers
  const handleManageColors = (accessory: Accessory) => {
    setSelectedAccessory(accessory);
    setNewColorName('');
    setNewColorHex('#000000');
    setColorDialogOpen(true);
  };

  const handleAddColor = async () => {
    if (!selectedAccessory || !newColorName) return;
    try {
      await apiClient.addAccessoryColor(selectedAccessory.id, {
        color_name: newColorName,
        hex_code: newColorHex,
      });
      setNewColorName('');
      setNewColorHex('#000000');
      fetchData();
      // Update selected accessory
      const updated = await apiClient.getAccessory(selectedAccessory.id);
      setSelectedAccessory(updated.data.accessory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add color');
    }
  };

  const handleDeleteColor = async (colorId: string) => {
    if (!selectedAccessory) return;
    try {
      await apiClient.deleteAccessoryColor(selectedAccessory.id, colorId);
      fetchData();
      const updated = await apiClient.getAccessory(selectedAccessory.id);
      setSelectedAccessory(updated.data.accessory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete color');
    }
  };

  // Link handlers
  const handleManageLinks = async (accessory: Accessory) => {
    setAccessoryForLinks(accessory);
    setLoadingLinks(true);
    setLinkDialogOpen(true);
    setNewLinkType('product');
    setNewLinkProductId('');
    setNewLinkCategoryId('');
    setNewLinkScreenSize('');

    try {
      const response = await apiClient.getAccessoryLinks(accessory.id);
      setAccessoryLinks(response.data.links || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch links');
      setAccessoryLinks([]);
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleAddLink = async () => {
    if (!accessoryForLinks) return;
    try {
      const data: {
        accessory_id: string;
        product_template_id?: string;
        category_id?: string;
        screen_size_filter?: string;
      } = {
        accessory_id: accessoryForLinks.id,
      };

      if (newLinkType === 'product' && newLinkProductId) {
        data.product_template_id = newLinkProductId;
      } else if (newLinkType === 'category' && newLinkCategoryId) {
        data.category_id = newLinkCategoryId;
      } else {
        return;
      }

      if (newLinkScreenSize) {
        data.screen_size_filter = newLinkScreenSize;
      }

      await apiClient.createAccessoryLink(data);

      // Refresh links
      const response = await apiClient.getAccessoryLinks(accessoryForLinks.id);
      setAccessoryLinks(response.data.links || []);

      setNewLinkProductId('');
      setNewLinkCategoryId('');
      setNewLinkScreenSize('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!accessoryForLinks) return;
    try {
      await apiClient.deleteAccessoryLink(linkId);
      const response = await apiClient.getAccessoryLinks(accessoryForLinks.id);
      setAccessoryLinks(response.data.links || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link');
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
            <h1 className="text-3xl font-bold tracking-tight">Accessories</h1>
            <p className="text-muted-foreground mt-1">
              Manage rental accessories like keyboards, mice, and cases.
            </p>
          </div>
          <Button
            onClick={handleAddAccessory}
            className="rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Accessory
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Accessories</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalAccessories}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold mt-1">{stats.activeAccessories}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Color Variants</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalColors}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
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

        {/* Accessories Table */}
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : accessories.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No accessories found. Add your first accessory to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Accessory</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Pricing</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Colors</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Links</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                      <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessories.map((accessory) => {
                      const AccessoryIcon = getAccessoryIcon(accessory.name);
                      return (
                        <tr key={accessory.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {accessory.image_url ? (
                                <img
                                  src={accessory.image_url}
                                  alt={accessory.name}
                                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                                  <AccessoryIcon className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{accessory.name}</div>
                                {accessory.description && (
                                  <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {accessory.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-xs space-y-0.5">
                              <div><span className="font-medium">{formatCurrency(accessory.weekly_rate)}</span>/wk</div>
                              <div><span className="font-medium">{formatCurrency(accessory.monthly_rate)}</span>/mo</div>
                              <div className="text-muted-foreground">{formatCurrency(accessory.deposit_amount)} deposit</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleManageColors(accessory)}
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {accessory.colors?.length || 0} colors
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleManageLinks(accessory)}
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="h-3 w-3" />
                              Manage links
                            </button>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              accessory.is_active
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {accessory.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditAccessory(accessory)}
                                className="h-8 w-8"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setAccessoryToDelete(accessory)}
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

        {/* Accessory Dialog */}
        <Dialog open={accessoryDialogOpen} onOpenChange={setAccessoryDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingAccessory ? 'Edit Accessory' : 'Add Accessory'}</DialogTitle>
              <DialogDescription>
                {editingAccessory ? 'Update the accessory details.' : 'Create a new rental accessory.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={accessoryForm.name}
                  onChange={(e) => setAccessoryForm({ ...accessoryForm, name: e.target.value })}
                  placeholder="Surface Pro Signature Keyboard"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={accessoryForm.description}
                  onChange={(e) => setAccessoryForm({ ...accessoryForm, description: e.target.value })}
                  placeholder="Accessory description..."
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
                      value={accessoryForm.weekly_rate}
                      onChange={(e) => setAccessoryForm({ ...accessoryForm, weekly_rate: e.target.value })}
                      placeholder="14.99"
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
                      value={accessoryForm.monthly_rate}
                      onChange={(e) => setAccessoryForm({ ...accessoryForm, monthly_rate: e.target.value })}
                      placeholder="39.99"
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
                      value={accessoryForm.deposit_amount}
                      onChange={(e) => setAccessoryForm({ ...accessoryForm, deposit_amount: e.target.value })}
                      placeholder="50.00"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={accessoryForm.image_url}
                  onChange={(e) => setAccessoryForm({ ...accessoryForm, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Display Order</label>
                  <Input
                    type="number"
                    value={accessoryForm.display_order}
                    onChange={(e) => setAccessoryForm({ ...accessoryForm, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={accessoryForm.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setAccessoryForm({ ...accessoryForm, is_active: e.target.value === 'active' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAccessoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveAccessory}
                disabled={!accessoryForm.name || !accessoryForm.weekly_rate || !accessoryForm.monthly_rate || !accessoryForm.deposit_amount}
              >
                {editingAccessory ? 'Save Changes' : 'Create Accessory'}
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
                Add or remove color options for {selectedAccessory?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedAccessory?.colors && selectedAccessory.colors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Colors</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAccessory.colors.map((color) => (
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Add New Color</label>
                <div className="flex gap-2">
                  <Input
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Color name (e.g., Black)"
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Button onClick={handleAddColor} disabled={!newColorName} size="sm">
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

        {/* Link Management Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Product Links</DialogTitle>
              <DialogDescription>
                Link {accessoryForLinks?.name} to products or categories
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Current links */}
              {loadingLinks ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : accessoryLinks.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Links</label>
                  <div className="space-y-2">
                    {accessoryLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {link.product ? (
                              <>
                                <span className="font-medium">Product:</span> {link.product.name}
                              </>
                            ) : link.category ? (
                              <>
                                <span className="font-medium">Category:</span> {link.category.name}
                              </>
                            ) : 'Unknown'}
                            {link.screen_size_filter && (
                              <span className="text-muted-foreground ml-2">
                                (Screen: {link.screen_size_filter})
                              </span>
                            )}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No links yet. Add a link below.
                </div>
              )}

              {/* Add new link */}
              <div className="space-y-3 border-t pt-4">
                <label className="text-sm font-medium">Add New Link</label>
                <div className="flex gap-2">
                  <select
                    value={newLinkType}
                    onChange={(e) => setNewLinkType(e.target.value as 'product' | 'category')}
                    className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="product">Product</option>
                    <option value="category">Category</option>
                  </select>
                  {newLinkType === 'product' ? (
                    <select
                      value={newLinkProductId}
                      onChange={(e) => setNewLinkProductId(e.target.value)}
                      className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select product...</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>{prod.name}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={newLinkCategoryId}
                      onChange={(e) => setNewLinkCategoryId(e.target.value)}
                      className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newLinkScreenSize}
                    onChange={(e) => setNewLinkScreenSize(e.target.value)}
                    placeholder="Screen size filter (optional, e.g., 13)"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddLink}
                    disabled={
                      (newLinkType === 'product' && !newLinkProductId) ||
                      (newLinkType === 'category' && !newLinkCategoryId)
                    }
                  >
                    Add Link
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!accessoryToDelete} onOpenChange={(open) => !open && setAccessoryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Accessory</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold">{accessoryToDelete?.name}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccessory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Accessory
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
