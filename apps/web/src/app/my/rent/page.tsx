'use client';

import { Suspense } from 'react';
import { RentalWizard } from '@/components/rental-wizard';
import { Loader2 } from 'lucide-react';

function WizardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function RentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rent Equipment</h1>
        <p className="text-muted-foreground">
          Complete the steps below to rent your equipment
        </p>
      </div>

      <Suspense fallback={<WizardLoading />}>
        <RentalWizard />
      </Suspense>
    </div>
  );
}
