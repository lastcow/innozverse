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
import { ApiClient, EquipmentStatus, EquipmentCondition } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Package,
  Boxes,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Filter,
  Download,
  Search,
  DollarSign,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface ProductTemplate {
  id: string;
  name: string;
  category_id: string;
}

interface Accessory {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  product_template_id: string | null;
  accessory_id: string | null;
  serial_number: string | null;
  color: string | null;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  purchase_date: string | null;
  purchase_price: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Flat fields from API JOIN
  product_name?: string | null;
  accessory_name?: string | null;
  category_name?: string | null;
  category_id?: string | null;
}

interface InventorySummary {
  total: number;
  by_status: Record<string, number>;
  by_condition: Record<string, number>;
  products: number;
  accessories: number;
}

const getStatusBadge = (status: EquipmentStatus) => {
  switch (status) {
    case 'available':
      return { label: 'Available', className: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
    case 'rented':
      return { label: 'Rented', className: 'bg-orange-100 text-orange-700 border-orange-200', icon: Package };
    case 'maintenance':
      return { label: 'Maintenance', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Wrench };
    case 'retired':
      return { label: 'Retired', className: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertTriangle };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200', icon: Package };
  }
};

const getConditionBadge = (condition: EquipmentCondition) => {
  switch (condition) {
    case 'new':
      return { label: 'New', className: 'text-purple-600' };
    case 'excellent':
      return { label: 'Excellent', className: 'text-green-600' };
    case 'good':
      return { label: 'Good', className: 'text-blue-600' };
    case 'fair':
      return { label: 'Fair', className: 'text-yellow-600' };
    default:
      return { label: condition, className: 'text-gray-600' };
  }
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(20);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Summary
  const [summary, setSummary] = useState<InventorySummary | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState({
    item_type: 'product' as 'product' | 'accessory',
    product_template_id: '',
    accessory_id: '',
    serial_number: '',
    color: '',
    status: 'available' as EquipmentStatus,
    condition: 'excellent' as EquipmentCondition,
    purchase_date: '',
    purchase_price: '',
    notes: '',
  });

  // Bulk add dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    item_type: 'product' as 'product' | 'accessory',
    product_template_id: '',
    accessory_id: '',
    color: '',
    quantity: 1,
    serial_prefix: '',
    starting_number: 1,
  });

  // Delete state
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [inventoryRes, productsRes, accessoriesRes, summaryRes] = await Promise.all([
        apiClient.listInventory({
          page: currentPage,
          limit,
          status: activeTab === 'all' ? undefined : activeTab,
          search: searchQuery || undefined,
        }),
        apiClient.listProducts({}),
        apiClient.listAdminAccessories({}),
        apiClient.getInventorySummary(),
      ]);

      setInventory(inventoryRes.data.inventory || []);
      setTotalPages(inventoryRes.data.pagination?.totalPages || 1);
      setTotalItems(inventoryRes.data.pagination?.total || 0);
      setProducts(productsRes.data.products || []);
      setAccessories(accessoriesRes.data.accessories || []);

      // Compute summary from products and accessories arrays
      const productsSummary = summaryRes.data.products || [];
      const accessoriesSummary = summaryRes.data.accessories || [];
      const computedSummary: InventorySummary = {
        total: 0,
        by_status: { available: 0, rented: 0, maintenance: 0, retired: 0 },
        by_condition: { new: 0, excellent: 0, good: 0, fair: 0 },
        products: productsSummary.length,
        accessories: accessoriesSummary.length,
      };

      // Sum up counts from products
      for (const p of productsSummary) {
        computedSummary.total += parseInt(p.total_count) || 0;
        computedSummary.by_status.available += parseInt(p.available_count) || 0;
        computedSummary.by_status.rented += parseInt(p.rented_count) || 0;
        computedSummary.by_status.maintenance += parseInt(p.maintenance_count) || 0;
      }

      // Sum up counts from accessories
      for (const a of accessoriesSummary) {
        computedSummary.total += parseInt(a.total_count) || 0;
        computedSummary.by_status.available += parseInt(a.available_count) || 0;
        computedSummary.by_status.rented += parseInt(a.rented_count) || 0;
        computedSummary.by_status.maintenance += parseInt(a.maintenance_count) || 0;
      }

      setSummary(computedSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, activeTab, searchQuery]);

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

  const handleTabChange = (tab: 'all' | 'available' | 'rented' | 'maintenance') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  // Single item handlers
  const handleAddItem = () => {
    setEditingItem(null);
    setItemForm({
      item_type: 'product',
      product_template_id: products[0]?.id || '',
      accessory_id: '',
      serial_number: '',
      color: '',
      status: 'available',
      condition: 'new',
      purchase_date: '',
      purchase_price: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      item_type: item.product_template_id ? 'product' : 'accessory',
      product_template_id: item.product_template_id || '',
      accessory_id: item.accessory_id || '',
      serial_number: item.serial_number || '',
      color: item.color || '',
      status: item.status,
      condition: item.condition,
      purchase_date: item.purchase_date || '',
      purchase_price: item.purchase_price || '',
      notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSaveItem = async () => {
    try {
      const data = {
        product_template_id: itemForm.item_type === 'product' ? itemForm.product_template_id : undefined,
        accessory_id: itemForm.item_type === 'accessory' ? itemForm.accessory_id : undefined,
        serial_number: itemForm.serial_number || undefined,
        color: itemForm.color || undefined,
        status: itemForm.status,
        condition: itemForm.condition,
        purchase_date: itemForm.purchase_date || undefined,
        purchase_price: itemForm.purchase_price ? parseFloat(itemForm.purchase_price) : undefined,
        notes: itemForm.notes || undefined,
      };

      if (editingItem) {
        await apiClient.updateInventoryItem(editingItem.id, data);
      } else {
        await apiClient.createInventoryItem(data);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await apiClient.deleteInventoryItem(itemToDelete.id);
      setItemToDelete(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      setItemToDelete(null);
    }
  };

  // Bulk add handlers
  const handleBulkAdd = () => {
    setBulkForm({
      item_type: 'product',
      product_template_id: products[0]?.id || '',
      accessory_id: '',
      color: '',
      quantity: 1,
      serial_prefix: '',
      starting_number: 1,
    });
    setBulkDialogOpen(true);
  };

  const handleBulkSave = async () => {
    try {
      const items = [];
      for (let i = 0; i < bulkForm.quantity; i++) {
        const serial = bulkForm.serial_prefix
          ? `${bulkForm.serial_prefix}${String(bulkForm.starting_number + i).padStart(4, '0')}`
          : undefined;
        items.push({
          product_template_id: bulkForm.item_type === 'product' ? bulkForm.product_template_id : undefined,
          accessory_id: bulkForm.item_type === 'accessory' ? bulkForm.accessory_id : undefined,
          serial_number: serial,
          color: bulkForm.color || undefined,
          status: 'available' as EquipmentStatus,
          condition: 'new' as EquipmentCondition,
        });
      }

      await apiClient.bulkCreateInventory(items);
      setBulkDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create items');
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">
              Track physical inventory items with serial numbers.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleBulkAdd}
              variant="outline"
              className="rounded-lg"
            >
              <Boxes className="mr-2 h-4 w-4" />
              Bulk Add
            </Button>
            <Button
              onClick={handleAddItem}
              className="rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Inventory</p>
                  <p className="text-2xl font-bold mt-1">{summary?.total || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Boxes className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold mt-1">{summary?.by_status?.available || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Currently Rented</p>
                  <p className="text-2xl font-bold mt-1">{summary?.by_status?.rented || 0}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">In Maintenance</p>
                  <p className="text-2xl font-bold mt-1">{summary?.by_status?.maintenance || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-orange-600" />
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

        {/* Inventory Table */}
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="p-0">
            {/* Tabs, Search, and Actions */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTabChange('all')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => handleTabChange('available')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'available'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Available
                  {(summary?.by_status?.available || 0) > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                      {summary?.by_status?.available}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('rented')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'rented'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Rented
                </button>
                <button
                  onClick={() => handleTabChange('maintenance')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'maintenance'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Maintenance
                  {(summary?.by_status?.maintenance || 0) > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                      {summary?.by_status?.maintenance}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search serial number..."
                      className="pl-9 w-48"
                    />
                  </div>
                </form>
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No inventory items found. Add your first item to get started.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Item</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Serial Number</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Color</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Condition</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Purchase</th>
                        <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => {
                        const statusBadge = getStatusBadge(item.status);
                        const conditionBadge = getConditionBadge(item.condition);
                        const StatusIcon = statusBadge.icon;

                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                                  <Package className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {item.product_name || item.accessory_name || 'Unknown'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.product_template_id ? 'Product' : 'Accessory'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              {item.serial_number ? (
                                <code className="text-sm bg-muted px-2 py-1 rounded">{item.serial_number}</code>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              {item.color ? (
                                <span className="text-sm">{item.color}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-sm font-medium ${conditionBadge.className}`}>
                                {conditionBadge.label}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="text-xs">
                                {item.purchase_date && (
                                  <div>{new Date(item.purchase_date).toLocaleDateString()}</div>
                                )}
                                {item.purchase_price && (
                                  <div className="text-muted-foreground">{formatCurrency(item.purchase_price)}</div>
                                )}
                                {!item.purchase_date && !item.purchase_price && (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditItem(item)}
                                  className="h-8 w-8"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setItemToDelete(item)}
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

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="rounded-lg"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="rounded-lg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Item Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the inventory item details.' : 'Add a new physical inventory item.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Item Type</label>
                <select
                  value={itemForm.item_type}
                  onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value as 'product' | 'accessory' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={!!editingItem}
                >
                  <option value="product">Product</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>

              {itemForm.item_type === 'product' ? (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Product *</label>
                  <select
                    value={itemForm.product_template_id}
                    onChange={(e) => setItemForm({ ...itemForm, product_template_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={!!editingItem}
                  >
                    <option value="">Select product...</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Accessory *</label>
                  <select
                    value={itemForm.accessory_id}
                    onChange={(e) => setItemForm({ ...itemForm, accessory_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={!!editingItem}
                  >
                    <option value="">Select accessory...</option>
                    {accessories.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Serial Number</label>
                  <Input
                    value={itemForm.serial_number}
                    onChange={(e) => setItemForm({ ...itemForm, serial_number: e.target.value })}
                    placeholder="SN-001234"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    value={itemForm.color}
                    onChange={(e) => setItemForm({ ...itemForm, color: e.target.value })}
                    placeholder="Platinum"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={itemForm.status}
                    onChange={(e) => setItemForm({ ...itemForm, status: e.target.value as EquipmentStatus })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Condition</label>
                  <select
                    value={itemForm.condition}
                    onChange={(e) => setItemForm({ ...itemForm, condition: e.target.value as EquipmentCondition })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Purchase Date</label>
                  <Input
                    type="date"
                    value={itemForm.purchase_date}
                    onChange={(e) => setItemForm({ ...itemForm, purchase_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Purchase Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={itemForm.purchase_price}
                      onChange={(e) => setItemForm({ ...itemForm, purchase_price: e.target.value })}
                      placeholder="999.99"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveItem}
                disabled={
                  (itemForm.item_type === 'product' && !itemForm.product_template_id) ||
                  (itemForm.item_type === 'accessory' && !itemForm.accessory_id)
                }
              >
                {editingItem ? 'Save Changes' : 'Add Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Add Dialog */}
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Bulk Add Inventory</DialogTitle>
              <DialogDescription>
                Add multiple inventory items at once with auto-generated serial numbers.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Item Type</label>
                <select
                  value={bulkForm.item_type}
                  onChange={(e) => setBulkForm({ ...bulkForm, item_type: e.target.value as 'product' | 'accessory' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="product">Product</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>

              {bulkForm.item_type === 'product' ? (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Product *</label>
                  <select
                    value={bulkForm.product_template_id}
                    onChange={(e) => setBulkForm({ ...bulkForm, product_template_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select product...</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Accessory *</label>
                  <select
                    value={bulkForm.accessory_id}
                    onChange={(e) => setBulkForm({ ...bulkForm, accessory_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select accessory...</option>
                    {accessories.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-2">
                <label className="text-sm font-medium">Color (optional)</label>
                <Input
                  value={bulkForm.color}
                  onChange={(e) => setBulkForm({ ...bulkForm, color: e.target.value })}
                  placeholder="Platinum"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Quantity *</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={bulkForm.quantity}
                    onChange={(e) => setBulkForm({ ...bulkForm, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Serial Prefix</label>
                  <Input
                    value={bulkForm.serial_prefix}
                    onChange={(e) => setBulkForm({ ...bulkForm, serial_prefix: e.target.value })}
                    placeholder="SP9-"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Start #</label>
                  <Input
                    type="number"
                    min="1"
                    value={bulkForm.starting_number}
                    onChange={(e) => setBulkForm({ ...bulkForm, starting_number: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {bulkForm.serial_prefix && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    Preview: {bulkForm.serial_prefix}{String(bulkForm.starting_number).padStart(4, '0')} to{' '}
                    {bulkForm.serial_prefix}{String(bulkForm.starting_number + bulkForm.quantity - 1).padStart(4, '0')}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkSave}
                disabled={
                  (bulkForm.item_type === 'product' && !bulkForm.product_template_id) ||
                  (bulkForm.item_type === 'accessory' && !bulkForm.accessory_id) ||
                  bulkForm.quantity < 1
                }
              >
                Add {bulkForm.quantity} Items
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this inventory item
                {itemToDelete?.serial_number && (
                  <span className="font-semibold"> ({itemToDelete.serial_number})</span>
                )}
                ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Item
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
