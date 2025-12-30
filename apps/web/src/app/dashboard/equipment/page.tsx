'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { EquipmentDialog, Equipment } from '@/components/equipment/equipment-dialog';
import { ApiClient, EquipmentCategory, EquipmentStatus } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Monitor,
  Laptop,
  Gamepad2,
  Keyboard,
  Mouse,
  Headphones,
  Tv,
  Package,
  Box,
  Wrench,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEquipment, setTotalEquipment] = useState(0);
  const [limit] = useState(10);

  // Stats state
  const [stats, setStats] = useState({
    totalEquipment: 0,
    available: 0,
    rented: 0,
    maintenance: 0,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // Delete equipment state
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

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

      // Fetch all equipment for stats
      const allResponse = await apiClient.listEquipment({ limit: 1000 });
      const allData = allResponse.data.equipment as Equipment[];

      // Calculate stats
      const available = allData.filter((e: Equipment) => e.status === 'available').length;
      const rented = allData.filter((e: Equipment) => e.status === 'rented').length;
      const maintenance = allData.filter((e: Equipment) => e.status === 'maintenance').length;

      setStats({
        totalEquipment: allData.length,
        available,
        rented,
        maintenance,
      });

      // Fetch paginated equipment for display
      const response = await apiClient.listEquipment({
        page: currentPage,
        limit: limit,
        status: activeTab === 'all' ? undefined : activeTab,
      });
      setEquipment(response.data.equipment);
      setTotalPages(response.data.pagination.totalPages);
      setTotalEquipment(response.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, activeTab]);

  useEffect(() => {
    const refreshToken = apiClient.getRefreshToken();
    if (refreshToken) {
      apiClient.refresh().then(() => {
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
    setDialogOpen(true);
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchEquipment();
  };

  const handleDialogError = (errorMessage: string) => {
    setError(errorMessage);
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

  const handleTabChange = (tab: 'all' | 'available' | 'rented' | 'maintenance') => {
    setActiveTab(tab);
    setCurrentPage(1);
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
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipment Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Manage your equipment catalog and track availability.
            </p>
          </div>
          <Button onClick={handleAdd} className="rounded-lg bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Equipment</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalEquipment}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+3%</span>
                    {' '}from last month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Box className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold mt-1">{stats.available}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+5%</span>
                    {' '}from last month
                  </p>
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
                  <p className="text-2xl font-bold mt-1">{stats.rented}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+12%</span>
                    {' '}from last month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Laptop className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Maintenance</p>
                  <p className="text-2xl font-bold mt-1">{stats.maintenance}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                    <span className="text-red-500">-2%</span>
                    {' '}from last month
                  </p>
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

        {/* Equipment Table */}
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="p-0">
            {/* Tabs and Actions */}
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
                  All Equipment
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
                  {stats.available > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                      {stats.available}
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
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'maintenance'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Maintenance
                  {stats.maintenance > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                      {stats.maintenance}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
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
                        <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.map((item) => {
                        const CategoryIcon = getCategoryIcon(item.category);
                        const statusBadge = getStatusBadge(item.status as EquipmentStatus);

                        return (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white flex-shrink-0">
                                    <CategoryIcon className="h-5 w-5" />
                                  </div>
                                )}
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
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(item)}
                                  className="h-8 w-8"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEquipmentToDelete(item)}
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

                {/* Pagination Controls */}
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalEquipment)} of {totalEquipment} items
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

        {/* Equipment Dialog (Add/Edit) */}
        <EquipmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          equipment={editingEquipment}
          onSuccess={handleDialogSuccess}
          onError={handleDialogError}
        />

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
