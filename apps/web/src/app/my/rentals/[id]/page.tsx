'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { ApiClient } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Package,
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Palette,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface RentalAccessory {
  id: string;
  accessory_id: string;
  selected_color?: string;
  weekly_rate: string;
  monthly_rate: string;
  deposit_amount: string;
  accessory?: {
    name: string;
    image_url?: string;
  };
}

interface RentalDetails {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  final_total?: string;
  pricing_period?: string;
  weekly_rate?: string;
  monthly_rate?: string;
  deposit_amount?: string;
  deposit_status?: string;
  selected_color?: string;
  notes?: string;
  student_discount_applied?: boolean;
  discount_amount?: string;
  new_equipment_fee_applied?: boolean;
  fee_amount?: string;
  pickup_date?: string;
  return_date?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  created_at: string;
  equipment?: {
    id: string;
    name: string;
    image_url?: string;
  };
  product_template?: {
    id: string;
    name: string;
    subtitle?: string;
    image_url?: string;
  };
  accessories?: RentalAccessory[];
}

export default function RentalDetailsPage() {
  const params = useParams();
  const rentalId = params.id as string;

  const [rental, setRental] = useState<RentalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const fetchRental = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
        }

        const response = await apiClient.getRentalDetails(rentalId);
        setRental(response.data.rental);
      } catch (err) {
        console.error('Failed to fetch rental:', err);
        setError('Failed to load rental details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRental();
  }, [rentalId]);

  const handleCancel = async () => {
    if (!rental) return;

    setCancelling(true);
    try {
      await apiClient.cancelRental(rental.id, cancelReason || 'User cancelled');
      // Refresh rental data
      const response = await apiClient.getRentalDetails(rentalId);
      setRental(response.data.rental);
    } catch (err) {
      console.error('Failed to cancel rental:', err);
      setError('Failed to cancel rental. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Package className="h-5 w-5 text-green-600" />;
      case 'pending':
      case 'confirmed':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(price));
  };

  const canCancel = rental && ['pending', 'confirmed'].includes(rental.status);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="space-y-6">
        <Link href="/my/rentals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rentals
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Rental not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/my/rentals">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rentals
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {rental.product_template?.name || rental.equipment?.name || 'Rental Details'}
          </h1>
          {rental.product_template?.subtitle && (
            <p className="text-muted-foreground mt-1">{rental.product_template.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(rental.status)}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
            {rental.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                <div className="h-32 w-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  {(rental.product_template?.image_url || rental.equipment?.image_url) ? (
                    <img
                      src={rental.product_template?.image_url || rental.equipment?.image_url}
                      alt={rental.product_template?.name || rental.equipment?.name || 'Equipment'}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {rental.product_template?.name || rental.equipment?.name}
                  </h3>
                  {rental.selected_color && (
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <Palette className="h-4 w-4" />
                      <span>Color: {rental.selected_color}</span>
                    </div>
                  )}
                  {rental.pricing_period && (
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{rental.pricing_period === 'weekly' ? 'Weekly' : 'Monthly'} rental</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rental Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(rental.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(rental.end_date)}</p>
                </div>
              </div>
              {(rental.pickup_date || rental.return_date) && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {rental.pickup_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">Picked Up</p>
                        <p className="font-medium">{formatDate(rental.pickup_date)}</p>
                      </div>
                    )}
                    {rental.return_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">Returned</p>
                        <p className="font-medium">{formatDate(rental.return_date)}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Accessories */}
          {rental.accessories && rental.accessories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Accessories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rental.accessories.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                          {acc.accessory?.image_url ? (
                            <img
                              src={acc.accessory.image_url}
                              alt={acc.accessory?.name || 'Accessory'}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{acc.accessory?.name || 'Accessory'}</p>
                          {acc.selected_color && (
                            <p className="text-sm text-muted-foreground">Color: {acc.selected_color}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatPrice(rental.pricing_period === 'weekly' ? acc.weekly_rate : acc.monthly_rate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          /{rental.pricing_period === 'weekly' ? 'week' : 'month'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {rental.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{rental.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Info */}
          {rental.status === 'cancelled' && rental.cancelled_at && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cancelled on {formatDate(rental.cancelled_at)}</strong>
                {rental.cancelled_reason && (
                  <p className="mt-1">Reason: {rental.cancelled_reason}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Pricing Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Base Rate */}
              {rental.weekly_rate && rental.pricing_period === 'weekly' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weekly Rate</span>
                  <span>{formatPrice(rental.weekly_rate)}</span>
                </div>
              )}
              {rental.monthly_rate && rental.pricing_period === 'monthly' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Rate</span>
                  <span>{formatPrice(rental.monthly_rate)}</span>
                </div>
              )}

              {/* Accessories subtotal */}
              {rental.accessories && rental.accessories.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accessories ({rental.accessories.length})</span>
                  <span>
                    {formatPrice(
                      rental.accessories
                        .reduce(
                          (sum, acc) =>
                            sum +
                            parseFloat(
                              rental.pricing_period === 'weekly' ? acc.weekly_rate : acc.monthly_rate
                            ),
                          0
                        )
                        .toString()
                    )}
                  </span>
                </div>
              )}

              {/* Discounts */}
              {rental.student_discount_applied && rental.discount_amount && (
                <div className="flex justify-between text-green-600">
                  <span>Student Discount</span>
                  <span>-{formatPrice(rental.discount_amount)}</span>
                </div>
              )}

              {/* Fees */}
              {rental.new_equipment_fee_applied && rental.fee_amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Equipment Fee</span>
                  <span>+{formatPrice(rental.fee_amount)}</span>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(rental.final_total || rental.total_amount)}</span>
              </div>

              {/* Deposit */}
              {rental.deposit_amount && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refundable Deposit</span>
                    <span>{formatPrice(rental.deposit_amount)}</span>
                  </div>
                  {rental.deposit_status && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit Status</span>
                      <span className="capitalize">{rental.deposit_status}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Cancel Rental
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Rental</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this rental? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Reason for cancellation (optional)"
                    value={cancelReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Rental</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel Rental'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Support */}
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Need help with this rental?</p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
