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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ApiClient, RentalStatus, EquipmentCategory } from '@innozverse/api-client';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
  Truck,
  MapPin,
  CircleDot,
  CircleCheck,
  Circle,
  Eye,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

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
  inventory_item_id?: string | null;
  product_template_id?: string | null;
  start_date: string;
  end_date: string;
  daily_rate: string;
  total_amount: string;
  status: RentalStatus;
  fulfillment_type?: 'pickup' | 'shipped' | null;
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

interface InventoryItem {
  id: string;
  product_template_id: string | null;
  serial_number: string | null;
  color: string | null;
  status: string;
  condition: string;
  product_name?: string;
}

interface EquipmentOption {
  id: string;
  name: string;
  category: EquipmentCategory;
  daily_rate: string;
  status: string;
}

// Workflow step configuration
const WORKFLOW_STEPS = [
  { key: 'pending', label: 'Pending', description: 'Awaiting confirmation' },
  { key: 'confirmed', label: 'Confirmed', description: 'Inventory assigned' },
  { key: 'active', label: 'Active', description: 'In customer possession' },
  { key: 'completed', label: 'Completed', description: 'Returned' },
];

// Workflow Progress Component
function WorkflowProgress({ status, fulfillmentType }: { status: RentalStatus; fulfillmentType?: 'pickup' | 'shipped' | null }) {
  const isCancelled = status === 'cancelled';
  const isOverdue = status === 'overdue';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <X className="h-4 w-4" />
        <span>Cancelled</span>
      </div>
    );
  }

  if (isOverdue) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span>Overdue - Awaiting Return</span>
      </div>
    );
  }

  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.key === status);

  return (
    <div className="flex items-center gap-1">
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CircleCheck className="h-4 w-4" />
                ) : isCurrent ? (
                  <CircleDot className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium ${
                  isCompleted
                    ? 'text-green-600'
                    : isCurrent
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < WORKFLOW_STEPS.length - 1 && (
              <div
                className={`w-4 h-0.5 mx-1 transition-all ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
      {fulfillmentType && (status === 'confirmed' || status === 'active' || status === 'completed') && (
        <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
          {fulfillmentType === 'shipped' ? (
            <>
              <Truck className="h-3 w-3" />
              <span>Shipped</span>
            </>
          ) : (
            <>
              <MapPin className="h-3 w-3" />
              <span>Pickup</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [, setAllRentals] = useState<Rental[]>([]); // For stats calculation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'current' | 'overdue' | 'pending'>('all');
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
    pendingRentals: 0,
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

  // Confirm rental with inventory assignment state
  const [rentalToConfirm, setRentalToConfirm] = useState<Rental | null>(null);
  const [availableInventory, setAvailableInventory] = useState<InventoryItem[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [confirmingRental, setConfirmingRental] = useState(false);

  // Fulfillment options state
  const [rentalToFulfill, setRentalToFulfill] = useState<Rental | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'shipped'>('pickup');
  const [fulfillingRental, setFulfillingRental] = useState(false);

  // View details state
  const [rentalToView, setRentalToView] = useState<Rental | null>(null);

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
        return { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'completed':
        return { label: 'Completed', className: 'bg-gray-100 text-gray-700 border-gray-200' };
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
      const pending = rentalsData.filter((r: Rental) => r.status === 'pending').length;
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
          pendingRentals: pending,
        });
      } catch (e) {
        console.error('Failed to fetch equipment:', e);
        setStats(prev => ({
          ...prev,
          activeRentals: active,
          overdueReturns: overdue,
          pendingRentals: pending,
          totalRevenue: revenue,
        }));
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

  const fetchAvailableInventory = async (_rental: Rental) => {
    try {
      setLoadingInventory(true);
      // Fetch inventory items that are available
      // Note: _rental parameter can be used in the future to filter by product_template_id
      const response = await apiClient.listInventory({
        status: 'available',
        limit: 100,
      });
      setAvailableInventory(response.data.inventory || []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setAvailableInventory([]);
    } finally {
      setLoadingInventory(false);
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

  // Open confirm dialog with inventory selection
  const openConfirmDialog = (rental: Rental) => {
    setRentalToConfirm(rental);
    setSelectedInventoryId('');
    fetchAvailableInventory(rental);
  };

  // Confirm rental with optional inventory assignment
  const handleConfirmRental = async () => {
    if (!rentalToConfirm) return;

    try {
      setConfirmingRental(true);

      // First confirm the rental
      await apiClient.confirmRental(rentalToConfirm.id);

      // If inventory was selected, assign it
      if (selectedInventoryId) {
        try {
          await apiClient.assignRentalInventory(rentalToConfirm.id, {
            inventory_item_id: selectedInventoryId,
          });
        } catch (invErr) {
          console.error('Failed to assign inventory:', invErr);
          // Continue even if inventory assignment fails
        }
      }

      setRentalToConfirm(null);
      setSelectedInventoryId('');
      fetchRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm rental');
    } finally {
      setConfirmingRental(false);
    }
  };

  // Open fulfillment dialog
  const openFulfillmentDialog = (rental: Rental) => {
    setRentalToFulfill(rental);
    setFulfillmentType('pickup');
  };

  // Handle fulfillment (pickup or ship)
  const handleFulfillment = async () => {
    if (!rentalToFulfill) return;

    try {
      setFulfillingRental(true);

      // Mark as picked up (both pickup and shipped transition to active)
      await apiClient.pickupRental(rentalToFulfill.id);

      // Note: In a full implementation, we would also update the fulfillment_type
      // This would require an API endpoint to update fulfillment details

      setRentalToFulfill(null);
      fetchRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process fulfillment');
    } finally {
      setFulfillingRental(false);
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
    if (activeTab === 'pending' && rental.status !== 'pending') return false;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
            <h1 className="text-3xl font-bold tracking-tight">Rental Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage rental requests and track equipment fulfillment.
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold mt-1">{stats.pendingRentals}</p>
                  <p className="text-xs text-yellow-600 mt-2">
                    Awaiting confirmation
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

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
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'pending'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pending
                  {stats.pendingRentals > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                      {stats.pendingRentals}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'current'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Active
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
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Equipment</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Customer</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Rental Period</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Workflow Status</th>
                        <th className="text-right p-4 font-medium text-sm text-muted-foreground">Amount</th>
                        <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRentals.map((rental) => {
                        const canCancel = ['pending', 'confirmed'].includes(rental.status);
                        const canConfirm = isAdmin && rental.status === 'pending';
                        const canFulfill = isAdmin && rental.status === 'confirmed';
                        const canReturn = isAdmin && (rental.status === 'active' || rental.status === 'overdue');

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
                                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                                    <Laptop className="h-6 w-6" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{rental.equipment.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {rental.equipment.serial_number && `SN: ${rental.equipment.serial_number}`}
                                    {rental.equipment.serial_number && rental.equipment.condition && ' - '}
                                    {rental.equipment.condition && (
                                      <span className={getConditionDisplay(rental.equipment.condition).className}>
                                        {getConditionDisplay(rental.equipment.condition).label}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              {rental.user ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-medium">
                                    {getInitials(rental.user.name)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">{rental.user.name}</div>
                                    <div className="text-xs text-muted-foreground">{rental.user.email}</div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">--</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                <div>{formatDate(rental.start_date)} - {formatDate(rental.end_date)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {calculateDays(rental.start_date, rental.end_date)} days
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <WorkflowProgress
                                status={rental.status}
                                fulfillmentType={rental.fulfillment_type}
                              />
                            </td>
                            <td className="p-4 text-right">
                              <div className="font-medium">{formatCurrency(rental.total_amount)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(rental.daily_rate)}/day
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
                                  <div className="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg z-10 py-1">
                                    <button
                                      onClick={() => {
                                        setRentalToView(rental);
                                        setOpenActionsMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View Details
                                    </button>

                                    {canConfirm && (
                                      <button
                                        onClick={() => {
                                          openConfirmDialog(rental);
                                          setOpenActionsMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-blue-600"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Confirm & Assign Inventory
                                      </button>
                                    )}
                                    {canFulfill && (
                                      <button
                                        onClick={() => {
                                          openFulfillmentDialog(rental);
                                          setOpenActionsMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-green-600"
                                      >
                                        <Package className="h-4 w-4" />
                                        Mark Fulfilled
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
                                      <>
                                        <div className="border-t my-1" />
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
                                      </>
                                    )}
                                    {!canConfirm && !canFulfill && !canReturn && !canCancel && (
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
                    <SearchableSelect
                      options={availableEquipment.map((equipment) => ({
                        value: equipment.id,
                        label: equipment.name,
                        description: `${formatCurrency(equipment.daily_rate)}/day`,
                      }))}
                      value={createFormData.equipment_id}
                      onChange={(value) => setCreateFormData({ ...createFormData, equipment_id: value })}
                      placeholder="Select equipment..."
                      searchPlaceholder="Search equipment..."
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Assign to User *</label>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <SearchableSelect
                      options={availableUsers.map((user) => ({
                        value: user.id,
                        label: user.name,
                        description: user.email,
                      }))}
                      value={createFormData.user_id}
                      onChange={(value) => setCreateFormData({ ...createFormData, user_id: value })}
                      placeholder="Select user..."
                      searchPlaceholder="Search by name or email..."
                    />
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

        {/* Confirm Rental with Inventory Assignment Dialog */}
        <Dialog open={!!rentalToConfirm} onOpenChange={(open) => !open && setRentalToConfirm(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Confirm Rental & Assign Inventory</DialogTitle>
              <DialogDescription>
                Review the rental details and optionally assign a specific inventory item.
              </DialogDescription>
            </DialogHeader>

            {rentalToConfirm && (
              <div className="space-y-4">
                {/* Rental Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {rentalToConfirm.equipment.image_url ? (
                      <img
                        src={rentalToConfirm.equipment.image_url}
                        alt={rentalToConfirm.equipment.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                        <Laptop className="h-8 w-8" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{rentalToConfirm.equipment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {rentalToConfirm.equipment.brand} {rentalToConfirm.equipment.model}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="ml-2 font-medium">{rentalToConfirm.user?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-2 font-medium">{formatCurrency(rentalToConfirm.total_amount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Period:</span>
                      <span className="ml-2 font-medium">
                        {formatDate(rentalToConfirm.start_date)} - {formatDate(rentalToConfirm.end_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 font-medium">
                        {calculateDays(rentalToConfirm.start_date, rentalToConfirm.end_date)} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inventory Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Assign Inventory Item (Optional)</label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select a specific inventory item to assign to this rental. This helps track which exact unit is being rented.
                  </p>

                  {loadingInventory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : availableInventory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No available inventory items found</p>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                      {availableInventory.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedInventoryId(selectedInventoryId === item.id ? '' : item.id)}
                          className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center justify-between ${
                            selectedInventoryId === item.id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedInventoryId === item.id
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedInventoryId === item.id && (
                                <CheckCircle className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {item.serial_number ? `SN: ${item.serial_number}` : `ID: ${item.id.slice(0, 8)}...`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.color && `${item.color} - `}
                                {item.condition}
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.condition === 'excellent' || item.condition === 'new'
                              ? 'bg-green-100 text-green-700'
                              : item.condition === 'good'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.condition}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setRentalToConfirm(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRental}
                disabled={confirmingRental}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {confirmingRental ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Rental
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Fulfillment Options Dialog */}
        <Dialog open={!!rentalToFulfill} onOpenChange={(open) => !open && setRentalToFulfill(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fulfill Rental</DialogTitle>
              <DialogDescription>
                Select how this rental will be fulfilled.
              </DialogDescription>
            </DialogHeader>

            {rentalToFulfill && (
              <div className="space-y-4">
                {/* Rental Info */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{rentalToFulfill.equipment.name}</div>
                      <div className="text-sm text-muted-foreground">
                        For: {rentalToFulfill.user?.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fulfillment Options */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Fulfillment Method</label>

                  <button
                    onClick={() => setFulfillmentType('pickup')}
                    className={`w-full p-4 border rounded-lg flex items-center gap-4 transition-all ${
                      fulfillmentType === 'pickup'
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      fulfillmentType === 'pickup' ? 'bg-blue-500 text-white' : 'bg-muted'
                    }`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Customer Pickup</div>
                      <div className="text-sm text-muted-foreground">
                        Customer will pick up the equipment in person
                      </div>
                    </div>
                    {fulfillmentType === 'pickup' && (
                      <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                    )}
                  </button>

                  <button
                    onClick={() => setFulfillmentType('shipped')}
                    className={`w-full p-4 border rounded-lg flex items-center gap-4 transition-all ${
                      fulfillmentType === 'shipped'
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      fulfillmentType === 'shipped' ? 'bg-blue-500 text-white' : 'bg-muted'
                    }`}>
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Ship to Customer</div>
                      <div className="text-sm text-muted-foreground">
                        Equipment will be shipped to the customer
                      </div>
                    </div>
                    {fulfillmentType === 'shipped' && (
                      <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setRentalToFulfill(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleFulfillment}
                disabled={fulfillingRental}
                className="bg-green-600 hover:bg-green-700"
              >
                {fulfillingRental ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {fulfillmentType === 'shipped' ? (
                      <>
                        <Truck className="h-4 w-4 mr-2" />
                        Mark as Shipped
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        Mark as Picked Up
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Rental Details Dialog */}
        <Dialog open={!!rentalToView} onOpenChange={(open) => !open && setRentalToView(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Rental Details</DialogTitle>
              <DialogDescription>
                Complete information about this rental.
              </DialogDescription>
            </DialogHeader>

            {rentalToView && (
              <div className="space-y-6">
                {/* Workflow Status */}
                <div className="flex items-center justify-center py-4 bg-muted/30 rounded-lg">
                  <WorkflowProgress
                    status={rentalToView.status}
                    fulfillmentType={rentalToView.fulfillment_type}
                  />
                </div>

                {/* Equipment Info */}
                <div className="flex items-start gap-4">
                  {rentalToView.equipment.image_url ? (
                    <img
                      src={rentalToView.equipment.image_url}
                      alt={rentalToView.equipment.name}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                      <Laptop className="h-10 w-10" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{rentalToView.equipment.name}</h3>
                    <p className="text-muted-foreground">
                      {rentalToView.equipment.brand} {rentalToView.equipment.model}
                    </p>
                    {rentalToView.equipment.serial_number && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Serial: {rentalToView.equipment.serial_number}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(rentalToView.status).className}`}>
                    {getStatusBadge(rentalToView.status).label}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Customer</label>
                    <p className="font-medium">{rentalToView.user?.name}</p>
                    <p className="text-sm text-muted-foreground">{rentalToView.user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Rental Period</label>
                    <p className="font-medium">
                      {formatDate(rentalToView.start_date)} - {formatDate(rentalToView.end_date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {calculateDays(rentalToView.start_date, rentalToView.end_date)} days
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Daily Rate</label>
                    <p className="font-medium">{formatCurrency(rentalToView.daily_rate)}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Total Amount</label>
                    <p className="font-medium text-lg">{formatCurrency(rentalToView.total_amount)}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(rentalToView.created_at).toLocaleString()}</span>
                    </div>
                    {rentalToView.pickup_date && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">Picked Up:</span>
                        <span>{new Date(rentalToView.pickup_date).toLocaleString()}</span>
                      </div>
                    )}
                    {rentalToView.return_date && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-muted-foreground">Returned:</span>
                        <span>{new Date(rentalToView.return_date).toLocaleString()}</span>
                      </div>
                    )}
                    {rentalToView.cancelled_at && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Cancelled:</span>
                        <span>{new Date(rentalToView.cancelled_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {(rentalToView.notes || rentalToView.cancelled_reason) && (
                  <div className="border-t pt-4">
                    {rentalToView.notes && (
                      <div className="mb-3">
                        <h4 className="font-medium mb-1">Notes</h4>
                        <p className="text-sm text-muted-foreground">{rentalToView.notes}</p>
                      </div>
                    )}
                    {rentalToView.cancelled_reason && (
                      <div>
                        <h4 className="font-medium mb-1 text-red-600">Cancellation Reason</h4>
                        <p className="text-sm text-muted-foreground">{rentalToView.cancelled_reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setRentalToView(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
