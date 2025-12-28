'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { ApiClient, EquipmentCategory, EquipmentStatus, EquipmentCondition } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  RotateCcw,
  Monitor,
  Laptop,
  Gamepad2,
  Keyboard,
  Mouse,
  Headphones,
  Tv,
  Package,
} from 'lucide-react';
import Link from 'next/link';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com'
);

const CATEGORIES: EquipmentCategory[] = [
  'laptop',
  'desktop',
  'monitor',
  'keyboard',
  'mouse',
  'headset',
  'gaming_console',
  'controller',
  'peripheral',
];

const STATUS_OPTIONS: EquipmentStatus[] = ['available', 'rented', 'maintenance', 'retired'];
const CONDITION_OPTIONS: EquipmentCondition[] = ['excellent', 'good', 'fair'];

interface Equipment {
  id: string;
  name: string;
  description: string | null;
  category: EquipmentCategory;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  daily_rate: string;
  image_url: string | null;
  specs: Record<string, string | number | boolean> | null;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEquipment, setTotalEquipment] = useState(0);
  const [limit] = useState(10);

  // Add/Edit equipment state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'laptop' as EquipmentCategory,
    brand: '',
    model: '',
    serial_number: '',
    daily_rate: '',
    image_url: '',
    condition: 'excellent' as EquipmentCondition,
    notes: '',
  });

  // Delete equipment state
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  // Actions menu state
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setOpenActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'laptop':
        return Laptop;
      case 'desktop':
        return Monitor;
      case 'monitor':
        return Tv;
      case 'keyboard':
        return Keyboard;
      case 'mouse':
        return Mouse;
      case 'headset':
        return Headphones;
      case 'gaming_console':
        return Gamepad2;
      case 'controller':
        return Gamepad2;
      default:
        return Package;
    }
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'available':
        return { label: 'Available', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'rented':
        return { label: 'Rented', className: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'maintenance':
        return { label: 'Maintenance', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      case 'retired':
        return { label: 'Retired', className: 'bg-gray-100 text-gray-700 border-gray-200' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.listEquipment({
        page: currentPage,
        limit: limit,
        search: search || undefined,
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
      });
      setEquipment(response.data.equipment);
      setTotalPages(response.data.pagination.totalPages);
      setTotalEquipment(response.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search, selectedCategory, selectedStatus]);

  useEffect(() => {
    const refreshToken = apiClient.getRefreshToken();
    if (refreshToken) {
      apiClient.refresh().then(async () => {
        // Check if user is admin
        try {
          const meResponse = await apiClient.getMe();
          const userRole = meResponse.data.user.role;
          setIsAdmin(userRole === 'admin' || userRole === 'super_user');
        } catch (e) {
          console.error('Failed to get user info:', e);
        }
        fetchEquipment();
      }).catch(() => {
        setError('Authentication failed. Please log in again.');
        setLoading(false);
      });
    } else {
      setError('No authentication token found. Please log in.');
      setLoading(false);
    }
  }, [fetchEquipment]);

  const handleAdd = () => {
    setEditingEquipment(null);
    setFormData({
      name: '',
      description: '',
      category: 'laptop',
      brand: '',
      model: '',
      serial_number: '',
      daily_rate: '',
      image_url: '',
      condition: 'excellent',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      brand: item.brand || '',
      model: item.model || '',
      serial_number: item.serial_number || '',
      daily_rate: item.daily_rate,
      image_url: item.image_url || '',
      condition: item.condition,
      notes: item.notes || '',
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingEquipment) {
        await apiClient.updateEquipment(editingEquipment.id, {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          serial_number: formData.serial_number || undefined,
          daily_rate: parseFloat(formData.daily_rate),
          image_url: formData.image_url || undefined,
          condition: formData.condition,
          notes: formData.notes || undefined,
        });
      } else {
        await apiClient.createEquipment({
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          serial_number: formData.serial_number || undefined,
          daily_rate: parseFloat(formData.daily_rate),
          image_url: formData.image_url || undefined,
          condition: formData.condition,
          notes: formData.notes || undefined,
        });
      }
      setShowAddModal(false);
      fetchEquipment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save equipment');
    }
  };

  const handleDelete = async () => {
    if (!equipmentToDelete) return;

    try {
      await apiClient.deleteEquipment(equipmentToDelete.id);
      setEquipmentToDelete(null);
      fetchEquipment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete equipment');
      setEquipmentToDelete(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const toggleActionsMenu = (equipmentId: string) => {
    setOpenActionsMenu(openActionsMenu === equipmentId ? null : equipmentId);
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Equipment</span>
        </div>

        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipment</h1>
            <p className="text-muted-foreground mt-1">Browse and manage rental equipment inventory.</p>
          </div>
          {isAdmin && (
            <Button onClick={handleAdd} className="rounded-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search equipment by name, brand, or model..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={handleReset}
                className="rounded-lg"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Table */}
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No equipment found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Equipment</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Category</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Daily Rate</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Condition</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Added</th>
                        {isAdmin && (
                          <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.map((item) => {
                        const CategoryIcon = getCategoryIcon(item.category);
                        const statusBadge = getStatusBadge(item.status);

                        return (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white flex-shrink-0">
                                  <CategoryIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.brand} {item.model}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm capitalize">{item.category.replace('_', ' ')}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-medium">{formatCurrency(item.daily_rate)}</span>
                              <span className="text-sm text-muted-foreground">/day</span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm capitalize">{item.condition}</span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {formatDate(item.created_at)}
                            </td>
                            {isAdmin && (
                              <td className="p-4 text-right">
                                <div className="relative inline-block" ref={openActionsMenu === item.id ? actionsMenuRef : null}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleActionsMenu(item.id)}
                                    className="h-8 w-8"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                  {openActionsMenu === item.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg z-10 py-1">
                                      <button
                                        onClick={() => {
                                          handleEdit(item);
                                          setOpenActionsMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEquipmentToDelete(item);
                                          setOpenActionsMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalEquipment)} of {totalEquipment} items
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {generatePageNumbers().map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                            ...
                          </span>
                        );
                      }
                      const pageNum = page as number;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="rounded-lg min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="rounded-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Equipment Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</CardTitle>
                <CardDescription>
                  {editingEquipment ? 'Update equipment information' : 'Add new equipment to inventory'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="MacBook Pro 16-inch"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Brand</label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Apple"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="M3 Pro"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Daily Rate *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                      placeholder="50.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value as EquipmentCondition })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {CONDITION_OPTIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition.charAt(0).toUpperCase() + condition.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Serial Number</label>
                  <Input
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="ABC123XYZ"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Equipment description..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Image URL</label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes..."
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!formData.name || !formData.daily_rate}
                  >
                    {editingEquipment ? 'Save Changes' : 'Add Equipment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Equipment Alert Dialog */}
        <AlertDialog open={!!equipmentToDelete} onOpenChange={(open) => !open && setEquipmentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete
                <span className="font-semibold"> {equipmentToDelete?.name}</span>
                from the inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Equipment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
