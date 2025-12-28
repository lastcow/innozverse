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
import { ApiClient, RentalStatus, EquipmentCategory } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Plus,
  MoreVertical,
  X,
  CheckCircle,
  Package,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  Laptop,
  AlertTriangle,
  DollarSign,
  Filter,
  Download,
} from 'lucide-react';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com'
);

interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  image_url: string | null;
  serial_number?: string | null;
  condition?: string | null;
  brand?: string | null;
  model?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface RentalUser {
  id: string;
  name: string;
  email: string;
}

interface Rental {
  id: string;
  user_id: string;
  equipment_id: string;
  start_date: string;
  end_date: string;
  daily_rate: string;
  total_amount: string;
  status: RentalStatus;
  notes: string | null;
  pickup_date: string | null;
  return_date: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
  user: RentalUser;
  equipment: Equipment;
}

interface EquipmentOption {
  id: string;
  name: string;
  category: EquipmentCategory;
  daily_rate: string;
  status: string;
}

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [, setAllRentals] = useState<Rental[]>([]); // For stats calculation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'current' | 'overdue'>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRentals, setTotalRentals] = useState(0);
  const [limit] = useState(10);

  // Stats state
  const [stats, setStats] = useState({
    totalInventory: 0,
    activeRentals: 0,
    overdueReturns: 0,
    totalRevenue: 0,
  });

  // Create rental state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentOption[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    equipment_id: '',
    user_id: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  // Cancel rental state
  const [rentalToCancel, setRentalToCancel] = useState<Rental | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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

  const getStatusBadge = (status: RentalStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      case 'confirmed':
        return { label: 'Confirmed', className: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'active':
        return { label: 'Rented', className: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'completed':
        return { label: 'Available', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'cancelled':
        return { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' };
      case 'overdue':
        return { label: 'Overdue', className: 'bg-red-100 text-red-700 border-red-200' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const fetchRentals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all rentals for stats
      const allResponse = await apiClient.listRentals({ limit: 1000 });
      setAllRentals(allResponse.data.rentals);
      
      // Calculate stats
      const rentalsData = allResponse.data.rentals as Rental[];
      const active = rentalsData.filter((r: Rental) => r.status === 'active').length;
      const overdue = rentalsData.filter((r: Rental) => r.status === 'overdue').length;
      const revenue = rentalsData
        .filter((r: Rental) => r.status === 'completed' || r.status === 'active')
        .reduce((sum: number, r: Rental) => sum + parseFloat(r.total_amount), 0);
      
      // Fetch equipment count for inventory
      try {
        const equipmentResponse = await apiClient.listEquipment({ limit: 1000 });
        setStats({
          totalInventory: equipmentResponse.data.equipment.length,
          activeRentals: active,
          overdueReturns: overdue,
          totalRevenue: revenue,
        });
      } catch (e) {
        console.error('Failed to fetch equipment:', e);
      }
      
      // Fetch paginated rentals for display
      const response = await apiClient.listRentals({
        page: currentPage,
        limit: limit,
        status: selectedStatus || undefined,
      });
      setRentals(response.data.rentals);
      setTotalPages(response.data.pagination.totalPages);
      setTotalRentals(response.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rentals');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, selectedStatus]);

  const fetchAvailableEquipment = async () => {
    try {
      setLoadingEquipment(true);
      const response = await apiClient.listEquipment({ status: 'available', limit: 100 });
      setAvailableEquipment(response.data.equipment);
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await apiClient.listUsers({ limit: 100 });
      setAvailableUsers(response.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

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
        fetchRentals();
      }).catch(() => {
        setError('Authentication failed. Please log in again.');
        setLoading(false);
      });
    } else {
      setError('No authentication token found. Please log in.');
      setLoading(false);
    }
  }, [fetchRentals]);

  const handleCreateRental = () => {
    setCreateFormData({
      equipment_id: '',
      user_id: '',
      start_date: '',
      end_date: '',
      notes: '',
    });
    fetchAvailableEquipment();
    fetchUsers();
    setShowCreateModal(true);
  };

  const handleSubmitRental = async () => {
    try {
      await apiClient.createRental({
        equipment_id: createFormData.equipment_id,
        user_id: createFormData.user_id || undefined,
        start_date: createFormData.start_date,
        end_date: createFormData.end_date,
        notes: createFormData.notes || undefined,
      });
      setShowCreateModal(false);
      fetchRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rental');
    }
  };

  const handleCancelRental = async () => {
    if (!rentalToCancel) return;

    try {
      await apiClient.cancelRental(rentalToCancel.id, cancelReason || undefined);
      setRentalToCancel(null);
      setCancelReason('');
      fetchRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel rental');
    }
  };

  const handleConfirmRental = async (rentalId: string) => {
    try {
      await apiClient.confirmRental(rentalId);
      fetchRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm rental');
    }
  };

  const handlePickupRental = async (rentalId: string) => {
    try {
      await apiClient.pickupRental(rentalId);
      fetchRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark rental as picked up');
    }
  };

  const handleReturnRental = async (rentalId: string) => {
    try {
      await apiClient.returnRental(rentalId);
      fetchRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark rental as returned');
    }
  };

  const toggleActionsMenu = (rentalId: string) => {
    setOpenActionsMenu(openActionsMenu === rentalId ? null : rentalId);
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateTotal = () => {
    if (!createFormData.equipment_id || !createFormData.start_date || !createFormData.end_date) {
      return null;
    }
    const equipment = availableEquipment.find(e => e.id === createFormData.equipment_id);
    if (!equipment) return null;
    const days = calculateDays(createFormData.start_date, createFormData.end_date);
    return (parseFloat(equipment.daily_rate) * days).toFixed(2);
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

  // Filter rentals by tab (client-side)
  const filteredRentals = rentals.filter((rental) => {
    if (activeTab === 'current' && rental.status !== 'active') return false;
    if (activeTab === 'overdue' && rental.status !== 'overdue') return false;
    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">
              Manage your inventory and track rental performance.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Today: {getTodayDate()}</span>
            <Button onClick={handleCreateRental} className="rounded-lg bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Rental
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Inventory</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalInventory}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+5%</span>
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
                  <p className="text-sm font-medium text-muted-foreground">Active Rentals</p>
                  <p className="text-2xl font-bold mt-1">{stats.activeRentals}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Overdue Returns</p>
                  <p className="text-2xl font-bold mt-1">{stats.overdueReturns}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                    <span className="text-red-500">-2%</span>
                    {' '}from last month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">${stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+8%</span>
                    {' '}from last month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
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

        {/* Rentals Table */}
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="p-0">
            {/* Tabs and Actions */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Rentals
                </button>
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'current'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Current Rentals
                </button>
                <button
                  onClick={() => setActiveTab('overdue')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'overdue'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Overdue
                  {stats.overdueReturns > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                      {stats.overdueReturns}
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
            ) : filteredRentals.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No rentals found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Laptop Model</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Serial Number</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Current User</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Condition</th>
                        <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRentals.map((rental) => {
                        const statusBadge = getStatusBadge(rental.status);
                        const canCancel = ['pending', 'confirmed'].includes(rental.status);
                        const canConfirm = isAdmin && rental.status === 'pending';
                        const canPickup = isAdmin && rental.status === 'confirmed';
                        const canReturn = isAdmin && rental.status === 'active';

                        const getConditionDisplay = (condition: string | null | undefined) => {
                          switch (condition) {
                            case 'excellent':
                              return { label: 'Excellent', className: 'text-green-500' };
                            case 'good':
                              return { label: 'Good', className: 'text-green-500' };
                            case 'fair':
                              return { label: 'Fair', className: 'text-yellow-500' };
                            default:
                              return { label: condition || 'Unknown', className: 'text-gray-500' };
                          }
                        };

                        const conditionDisplay = getConditionDisplay(rental.equipment.condition);

                        return (
                          <tr
                            key={rental.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {rental.equipment.image_url ? (
                                  <img
                                    src={rental.equipment.image_url}
                                    alt={rental.equipment.name}
                                    className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                                    <Laptop className="h-5 w-5" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{rental.equipment.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {rental.equipment.brand} {rental.equipment.model}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-muted-foreground">
                                {rental.equipment.serial_number ? `SN-${rental.equipment.serial_number}` : '--'}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="p-4">
                              {rental.user ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-medium">
                                    {getInitials(rental.user.name)}
                                  </div>
                                  <span className="font-medium">{rental.user.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">--</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block h-2 w-2 rounded-full ${conditionDisplay.className.replace('text-', 'bg-')}`}></span>
                                <span className="text-sm">{conditionDisplay.label}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="relative inline-block" ref={openActionsMenu === rental.id ? actionsMenuRef : null}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleActionsMenu(rental.id)}
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                                {openActionsMenu === rental.id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg z-10 py-1">
                                    {canConfirm && (
                                      <button
                                        onClick={() => {
                                          handleConfirmRental(rental.id);
                                          setOpenActionsMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Confirm Rental
                                      </button>
                                    )}
                                    {canPickup && (
                                      <button
                                        onClick={() => {
                                          handlePickupRental(rental.id);
                                          setOpenActionsMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                      >
                                        <Package className="h-4 w-4" />
                                        Mark Picked Up
                                      </button>
                                    )}
                                    {canReturn && (
                                      <button
                                        onClick={() => {
                                          handleReturnRental(rental.id);
                                          setOpenActionsMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                      >
                                        <Clock className="h-4 w-4" />
                                        Mark Returned
                                      </button>
                                    )}
                                    {canCancel && (
                                      <button
                                        onClick={() => {
                                          setRentalToCancel(rental);
                                          setOpenActionsMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                                      >
                                        <X className="h-4 w-4" />
                                        Cancel Rental
                                      </button>
                                    )}
                                    {!canConfirm && !canPickup && !canReturn && !canCancel && (
                                      <div className="px-4 py-2 text-sm text-muted-foreground">
                                        No actions available
                                      </div>
                                    )}
                                  </div>
                                )}
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
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRentals)} of {totalRentals} results
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

        {/* Create Rental Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>New Rental</CardTitle>
                <CardDescription>Select equipment and rental period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Equipment *</label>
                  {loadingEquipment ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <select
                      value={createFormData.equipment_id}
                      onChange={(e) => setCreateFormData({ ...createFormData, equipment_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select equipment...</option>
                      {availableEquipment.map((equipment) => (
                        <option key={equipment.id} value={equipment.id}>
                          {equipment.name} - {formatCurrency(equipment.daily_rate)}/day
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Assign to User *</label>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <select
                      value={createFormData.user_id}
                      onChange={(e) => setCreateFormData({ ...createFormData, user_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select user...</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date *</label>
                    <Input
                      type="date"
                      value={createFormData.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCreateFormData({ ...createFormData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date *</label>
                    <Input
                      type="date"
                      value={createFormData.end_date}
                      min={createFormData.start_date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCreateFormData({ ...createFormData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                {calculateTotal() && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estimated Total</span>
                      <span className="text-lg font-bold">${calculateTotal()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {calculateDays(createFormData.start_date, createFormData.end_date)} day(s) x{' '}
                      {formatCurrency(availableEquipment.find(e => e.id === createFormData.equipment_id)?.daily_rate || '0')}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    value={createFormData.notes}
                    onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                    placeholder="Any special requirements..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitRental}
                    disabled={!createFormData.equipment_id || !createFormData.user_id || !createFormData.start_date || !createFormData.end_date}
                  >
                    Create Rental
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cancel Rental Alert Dialog */}
        <AlertDialog open={!!rentalToCancel} onOpenChange={(open) => !open && setRentalToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Rental</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this rental for
                <span className="font-semibold"> {rentalToCancel?.equipment.name}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why are you cancelling this rental?"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCancelReason('')}>Keep Rental</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelRental}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Cancel Rental
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
