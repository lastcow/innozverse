'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Package, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useWizard } from '../wizard-context';
import { cn } from '@/lib/utils';

export function StepDates() {
  const { state, dispatch } = useWizard();
  const product = state.product;

  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');

  // Initialize from state
  useEffect(() => {
    if (state.startDate) {
      setStartDateStr(state.startDate.toISOString().split('T')[0]);
    }
    if (state.endDate) {
      setEndDateStr(state.endDate.toISOString().split('T')[0]);
    }
  }, [state.startDate, state.endDate]);

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No product selected</h3>
        <p className="text-muted-foreground">Please go back and select a product first.</p>
      </div>
    );
  }

  const handleStartDateChange = (dateStr: string) => {
    setStartDateStr(dateStr);
    if (dateStr && endDateStr) {
      const start = new Date(dateStr);
      const end = new Date(endDateStr);
      if (end >= start) {
        dispatch({ type: 'SET_DATES', startDate: start, endDate: end });
      }
    }
  };

  const handleEndDateChange = (dateStr: string) => {
    setEndDateStr(dateStr);
    if (startDateStr && dateStr) {
      const start = new Date(startDateStr);
      const end = new Date(dateStr);
      if (end >= start) {
        dispatch({ type: 'SET_DATES', startDate: start, endDate: end });
      }
    }
  };

  const handlePeriodChange = (period: 'weekly' | 'monthly') => {
    dispatch({ type: 'SET_PRICING_PERIOD', period });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(price));
  };

  // Calculate duration
  const getDuration = () => {
    if (!state.startDate || !state.endDate) return null;
    const diff = state.endDate.getTime() - state.startDate.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    const weeks = Math.ceil(days / 7);
    const months = Math.ceil(days / 30);
    return { days, weeks, months };
  };

  const duration = getDuration();

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Rental Period</h2>
        <p className="text-muted-foreground">Choose your rental dates and pricing period</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Rental Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDateStr}
                  min={today}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDateStr}
                  min={startDateStr || today}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                />
              </div>
            </div>

            {duration && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold">
                  {duration.days} {duration.days === 1 ? 'day' : 'days'}
                  {duration.weeks > 0 && ` (${duration.weeks} ${duration.weeks === 1 ? 'week' : 'weeks'})`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pricing Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how you want to be billed. Monthly rates offer better value for longer rentals.
            </p>

            <div className="grid gap-3">
              <button
                onClick={() => handlePeriodChange('weekly')}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left',
                  state.pricingPeriod === 'weekly'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div>
                  <p className="font-semibold">Weekly</p>
                  <p className="text-sm text-muted-foreground">Billed per week</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatPrice(product.weekly_rate)}</p>
                  <p className="text-xs text-muted-foreground">/week</p>
                </div>
              </button>

              <button
                onClick={() => handlePeriodChange('monthly')}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left',
                  state.pricingPeriod === 'monthly'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div>
                  <p className="font-semibold">Monthly</p>
                  <p className="text-sm text-muted-foreground">Billed per month</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatPrice(product.monthly_rate)}</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </button>
            </div>

            {/* Price comparison */}
            {duration && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Estimated Cost</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {state.pricingPeriod === 'weekly'
                      ? `${duration.weeks} week(s)`
                      : `${duration.months} month(s)`}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(
                      (
                        parseFloat(
                          state.pricingPeriod === 'weekly'
                            ? product.weekly_rate
                            : product.monthly_rate
                        ) * (state.pricingPeriod === 'weekly' ? duration.weeks : duration.months)
                      ).toString()
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  + accessories (if selected) + refundable deposit
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
