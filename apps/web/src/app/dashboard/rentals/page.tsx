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
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  RotateCcw,
  Calendar,
  X,
  CheckCircle,
  Package,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com'
);

const RENTAL_STATUS_OPTIONS: RentalStatus[] = [
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'overdue',
];

interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  image_url: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRentals, setTotalRentals] = useState(0);
  const [limit] = useState(10);

  // Create rental state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentOption[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    equipment_id: '',
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
        return { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'completed':
        return { label: 'Completed', className: 'bg-gray-100 text-gray-700 border-gray-200' };
      case 'cancelled':
        return { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' };
      case 'overdue':
        return { label: 'Overdue', className: 'bg-orange-100 text-orange-700 border-orange-200' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const fetchRentals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
      start_date: '',
      end_date: '',
      notes: '',
    });
    fetchAvailableEquipment();
    setShowCreateModal(true);
  };

  const handleSubmitRental = async () => {
    try {
      await apiClient.createRental({
        equipment_id: createFormData.equipment_id,
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

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const toggleActionsMenu = (rentalId: string) => {
    setOpenActionsMenu(openActionsMenu === rentalId ? null : rentalId);
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

  // Filter rentals by search (client-side)
  const filteredRentals = rentals.filter((rental) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      rental.equipment.name.toLowerCase().includes(searchLower) ||
      rental.user.name.toLowerCase().includes(searchLower) ||
      rental.user.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Rentals</span>
        </div>

        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rentals</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Manage all equipment rentals.' : 'View and manage your equipment rentals.'}
            </p>
          </div>
          <Button onClick={handleCreateRental} className="rounded-lg">
            <Plus className="mr-2 h-4 w-4" />
            New Rental
          </Button>
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
                  placeholder="Search by equipment or user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Status</option>
                {RENTAL_STATUS_OPTIONS.map((status) => (
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

        {/* Rentals Table */}
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="p-0">
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
                        {isAdmin && (
                          <th className="text-left p-4 font-medium text-sm text-muted-foreground">User</th>
                        )}
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Period</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Total</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Created</th>
                        <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRentals.map((rental) => {
                        const statusBadge = getStatusBadge(rental.status);
                        const days = calculateDays(rental.start_date, rental.end_date);
                        const canCancel = ['pending', 'confirmed'].includes(rental.status);
                        const canConfirm = isAdmin && rental.status === 'pending';
                        const canPickup = isAdmin && rental.status === 'confirmed';
                        const canReturn = isAdmin && rental.status === 'active';

                        return (
                          <tr
                            key={rental.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white flex-shrink-0">
                                  <Package className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium">{rental.equipment.name}</div>
                                  <div className="text-sm text-muted-foreground capitalize">
                                    {rental.equipment.category.replace('_', ' ')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {isAdmin && (
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">{rental.user.name}</div>
                                  <div className="text-sm text-muted-foreground">{rental.user.email}</div>
                                </div>
                              </td>
                            )}
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm">
                                    {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{days} day(s)</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{formatCurrency(rental.total_amount)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(rental.daily_rate)}/day
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {formatDate(rental.created_at)}
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
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRentals)} of {totalRentals} rentals
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
                    disabled={!createFormData.equipment_id || !createFormData.start_date || !createFormData.end_date}
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
