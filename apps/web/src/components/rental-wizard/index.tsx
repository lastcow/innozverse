'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ApiClient } from '@innozverse/api-client';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WizardProvider, useWizard } from './wizard-context';
import { WizardProgress } from './wizard-progress';
import { StepProduct } from './steps/step-product';
import { StepColor } from './steps/step-color';
import { StepAccessories } from './steps/step-accessories';
import { StepDates } from './steps/step-dates';
import { StepReview } from './steps/step-review';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

function WizardContent() {
  const { state, dispatch, canProceed } = useWizard();
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');

  // Pre-load product if specified in URL
  useEffect(() => {
    const loadProduct = async () => {
      if (productId && !state.product) {
        try {
          const refreshToken = apiClient.getRefreshToken();
          if (refreshToken) {
            await apiClient.refresh();
          }

          const response = await apiClient.getProduct(productId);
          dispatch({ type: 'SET_PRODUCT', product: response.data.product });

          // If product has colors, stay on step 1, otherwise go to step 2
          if (response.data.product.colors?.length > 0) {
            dispatch({ type: 'NEXT_STEP' });
          } else {
            dispatch({ type: 'GO_TO_STEP', step: 3 });
          }
        } catch (err) {
          console.error('Failed to load product:', err);
        }
      }
    };

    loadProduct();
  }, [productId, state.product, dispatch]);

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return <StepProduct />;
      case 2:
        return <StepColor />;
      case 3:
        return <StepAccessories />;
      case 4:
        return <StepDates />;
      case 5:
        return <StepReview />;
      default:
        return <StepProduct />;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handlePrev = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <WizardProgress />
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      {state.step < 5 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={state.step === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {state.step === 4 ? 'Review Order' : 'Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function RentalWizard() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
