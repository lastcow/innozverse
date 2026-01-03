'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Plus, X, Check } from 'lucide-react';
import { useWizard, Accessory } from '../wizard-context';
import { cn } from '@/lib/utils';

export function StepAccessories() {
  const { state, dispatch } = useWizard();
  const product = state.product;

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No product selected</h3>
        <p className="text-muted-foreground">Please go back and select a product first.</p>
      </div>
    );
  }

  const accessories = product.accessories || [];

  const handleToggleAccessory = (accessory: Accessory) => {
    const isSelected = state.accessories.find((a) => a.accessory_id === accessory.id);
    if (isSelected) {
      dispatch({ type: 'REMOVE_ACCESSORY', accessory_id: accessory.id });
    } else {
      const defaultColor = accessory.colors?.[0]?.color_name;
      dispatch({ type: 'ADD_ACCESSORY', accessory, color: defaultColor });
    }
  };

  const handleColorChange = (accessoryId: string, color: string) => {
    dispatch({ type: 'UPDATE_ACCESSORY_COLOR', accessory_id: accessoryId, color });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(price));
  };

  const selectedAccessoryTotal = state.accessories.reduce((sum, acc) => {
    return sum + parseFloat(acc.accessory.weekly_rate);
  }, 0);

  if (accessories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Add Accessories</h2>
          <p className="text-muted-foreground">No compatible accessories available</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No accessories are available for this product. Continue to the next step.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Add Accessories</h2>
        <p className="text-muted-foreground">
          Enhance your rental with compatible accessories (optional)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Accessories List */}
        <div className="lg:col-span-2 space-y-4">
          {accessories.map((accessory) => {
            const selectedAcc = state.accessories.find((a) => a.accessory_id === accessory.id);
            const isSelected = !!selectedAcc;

            return (
              <Card
                key={accessory.id}
                className={cn(
                  'transition-all',
                  isSelected && 'ring-2 ring-purple-600 bg-purple-50/50'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {accessory.image_url ? (
                        <img
                          src={accessory.image_url}
                          alt={accessory.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{accessory.name}</h4>
                          {accessory.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {accessory.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">{formatPrice(accessory.weekly_rate)}</p>
                          <p className="text-xs text-muted-foreground">/week</p>
                        </div>
                      </div>

                      {/* Color selector (if selected and has colors) */}
                      {isSelected && accessory.colors && accessory.colors.length > 0 && (
                        <div className="mt-3">
                          <Select
                            value={selectedAcc.selected_color || ''}
                            onValueChange={(value) => handleColorChange(accessory.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                              {accessory.colors.map((color) => (
                                <SelectItem key={color.id} value={color.color_name}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-4 w-4 rounded-full border"
                                      style={{ backgroundColor: color.hex_code || '#gray' }}
                                    />
                                    {color.color_name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Toggle button */}
                      <div className="mt-3">
                        <Button
                          variant={isSelected ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleToggleAccessory(accessory)}
                          className={cn(
                            isSelected && 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                          )}
                        >
                          {isSelected ? (
                            <>
                              <X className="mr-1 h-4 w-4" />
                              Remove
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1 h-4 w-4" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Selected Accessories</CardTitle>
            </CardHeader>
            <CardContent>
              {state.accessories.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No accessories selected. This is optional.
                </p>
              ) : (
                <div className="space-y-3">
                  {state.accessories.map((acc) => (
                    <div key={acc.accessory_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{acc.accessory.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPrice(acc.accessory.weekly_rate)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weekly Total</span>
                      <span className="font-semibold">
                        +{formatPrice(selectedAccessoryTotal.toString())}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
