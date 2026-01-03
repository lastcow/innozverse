'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Check } from 'lucide-react';
import { useWizard } from '../wizard-context';
import { cn } from '@/lib/utils';

export function StepColor() {
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

  const colors = product.colors || [];

  if (colors.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Select Color</h2>
          <p className="text-muted-foreground">This product has no color options</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              This product is available in a single color. Continue to the next step.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectColor = (colorName: string) => {
    dispatch({ type: 'SET_COLOR', color: colorName });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Color</h2>
        <p className="text-muted-foreground">Choose your preferred color for {product.name}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              {state.selectedColor && (
                <p className="text-muted-foreground">Selected: {state.selectedColor}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Color Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {colors.map((color) => {
                const isSelected = state.selectedColor === color.color_name;

                return (
                  <button
                    key={color.id}
                    onClick={() => handleSelectColor(color.color_name)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {/* Color swatch */}
                    <div
                      className="h-12 w-12 rounded-full border-2 border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: color.hex_code || '#gray' }}
                    />

                    {/* Color name */}
                    <div className="flex-1">
                      <p className="font-medium">{color.color_name}</p>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
