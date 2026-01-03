'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiClient } from '@innozverse/api-client';
import {
  Package,
  Palette,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
  Puzzle,
} from 'lucide-react';
import { useWizard, PricingBreakdown } from '../wizard-context';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

export function StepReview() {
  const router = useRouter();
  const { state, dispatch } = useWizard();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdRentalId, setCreatedRentalId] = useState<string | null>(null);

  const product = state.product;

  // Calculate pricing on mount
  useEffect(() => {
    const calculatePricing = async () => {
      if (!product || !state.startDate || !state.endDate) return;

      setCalculatingPrice(true);
      try {
        // Calculate duration
        const diff = state.endDate.getTime() - state.startDate.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
        const periods =
          state.pricingPeriod === 'weekly' ? Math.ceil(days / 7) : Math.ceil(days / 30);

        // Product rate
        const productRate =
          parseFloat(
            state.pricingPeriod === 'weekly' ? product.weekly_rate : product.monthly_rate
          ) * periods;

        // Accessories rate
        const accessoriesRate = state.accessories.reduce((sum, acc) => {
          const rate =
            state.pricingPeriod === 'weekly'
              ? acc.accessory.weekly_rate
              : acc.accessory.monthly_rate;
          return sum + parseFloat(rate) * periods;
        }, 0);

        // Deposit
        const productDeposit = parseFloat(product.deposit_amount);
        const accessoriesDeposit = state.accessories.reduce((sum, acc) => {
          return sum + parseFloat(acc.accessory.deposit_amount);
        }, 0);
        const depositTotal = productDeposit + accessoriesDeposit;

        const subtotal = productRate + accessoriesRate;

        // For now, we'll calculate without API (student discount, etc would need API)
        const pricing: PricingBreakdown = {
          product_rate: productRate,
          accessories_rate: accessoriesRate,
          subtotal,
          deposit_total: depositTotal,
          final_total: subtotal,
        };

        dispatch({ type: 'SET_PRICING', pricing });
      } catch (err) {
        console.error('Failed to calculate pricing:', err);
      } finally {
        setCalculatingPrice(false);
      }
    };

    calculatePricing();
  }, [product, state.startDate, state.endDate, state.pricingPeriod, state.accessories, dispatch]);

  if (!product || !state.startDate || !state.endDate) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Missing information</h3>
        <p className="text-muted-foreground">Please go back and complete all steps.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!termsAccepted || !state.pricing) return;

    setSubmitting(true);
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const refreshToken = apiClient.getRefreshToken();
      if (refreshToken) {
        await apiClient.refresh();
      }

      const response = await apiClient.createEnhancedRental({
        product_template_id: product.id,
        selected_color: state.selectedColor || undefined,
        pricing_period: state.pricingPeriod,
        start_date: state.startDate!.toISOString().split('T')[0],
        end_date: state.endDate!.toISOString().split('T')[0],
        accessories: state.accessories.map((acc) => ({
          accessory_id: acc.accessory_id,
          selected_color: acc.selected_color || undefined,
        })),
        notes: state.notes || undefined,
      });

      setSuccess(true);
      setCreatedRentalId(response.data.rental.id);
    } catch (err: unknown) {
      console.error('Failed to create rental:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create rental. Please try again.';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (success && createdRentalId) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Rental Confirmed!</h2>
        <p className="text-muted-foreground mb-6">
          Your rental has been created successfully. We&apos;ll be in touch with pickup details.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push('/my/rentals')}>
            View My Rentals
          </Button>
          <Button
            onClick={() => router.push(`/my/rentals/${createdRentalId}`)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            View This Rental
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & Confirm</h2>
        <p className="text-muted-foreground">Please review your rental details before confirming</p>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="h-24 w-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  {product.subtitle && (
                    <p className="text-muted-foreground">{product.subtitle}</p>
                  )}
                  {state.selectedColor && (
                    <div className="flex items-center gap-2 mt-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Color: {state.selectedColor}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accessories */}
          {state.accessories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Puzzle className="h-5 w-5" />
                  Accessories ({state.accessories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.accessories.map((acc) => (
                    <div key={acc.accessory_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{acc.accessory.name}</p>
                        {acc.selected_color && (
                          <p className="text-sm text-muted-foreground">Color: {acc.selected_color}</p>
                        )}
                      </div>
                      <p className="font-medium">
                        {formatPrice(
                          parseFloat(
                            state.pricingPeriod === 'weekly'
                              ? acc.accessory.weekly_rate
                              : acc.accessory.monthly_rate
                          )
                        )}
                        /{state.pricingPeriod === 'weekly' ? 'week' : 'month'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rental Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(state.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(state.endDate)}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Billing Period</p>
                <p className="font-medium capitalize">{state.pricingPeriod}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any special requests or notes for your rental..."
                value={state.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => dispatch({ type: 'SET_NOTES', notes: e.target.value })}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Pricing Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {calculatingPrice ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : state.pricing ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equipment</span>
                      <span>{formatPrice(state.pricing.product_rate)}</span>
                    </div>
                    {state.pricing.accessories_rate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accessories</span>
                        <span>{formatPrice(state.pricing.accessories_rate)}</span>
                      </div>
                    )}
                    {state.pricing.student_discount && (
                      <div className="flex justify-between text-green-600">
                        <span>Student Discount</span>
                        <span>-{formatPrice(state.pricing.student_discount)}</span>
                      </div>
                    )}
                    {state.pricing.new_equipment_fee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">New Equipment Fee</span>
                        <span>+{formatPrice(state.pricing.new_equipment_fee)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(state.pricing.final_total)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refundable Deposit</span>
                    <span>{formatPrice(state.pricing.deposit_total)}</span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Deposit will be returned upon equipment return in good condition.
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Unable to calculate pricing</p>
              )}
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setTermsAccepted(!!checked)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the rental terms and conditions. I understand that I am responsible for the
                  equipment during the rental period.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!termsAccepted || !state.pricing || submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Rental'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
