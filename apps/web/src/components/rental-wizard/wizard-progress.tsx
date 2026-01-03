'use client';

import { cn } from '@/lib/utils';
import { Check, Package, Palette, Puzzle, Calendar, ClipboardCheck } from 'lucide-react';
import { useWizard } from './wizard-context';

const steps = [
  { number: 1, title: 'Product', icon: Package },
  { number: 2, title: 'Color', icon: Palette },
  { number: 3, title: 'Accessories', icon: Puzzle },
  { number: 4, title: 'Dates', icon: Calendar },
  { number: 5, title: 'Review', icon: ClipboardCheck },
];

export function WizardProgress() {
  const { state, dispatch } = useWizard();
  const currentStep = state.step;

  const canGoToStep = (stepNumber: number) => {
    // Can always go back
    if (stepNumber < currentStep) return true;
    // Can only go forward if we've already visited
    if (stepNumber === currentStep) return true;
    return false;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = canGoToStep(step.number);
          const Icon = step.icon;

          return (
            <div key={step.number} className="flex items-center flex-1">
              <button
                onClick={() => isClickable && dispatch({ type: 'GO_TO_STEP', step: step.number })}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all',
                  isClickable && 'cursor-pointer hover:opacity-80',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                    isCompleted && 'bg-green-600 border-green-600 text-white',
                    isCurrent && 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white',
                    !isCompleted && !isCurrent && 'bg-muted border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isCurrent && 'text-foreground',
                    !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </button>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={cn(
                      'h-0.5 w-full transition-colors',
                      currentStep > step.number ? 'bg-green-600' : 'bg-muted'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
