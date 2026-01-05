'use client';

import { Suspense } from 'react';
import { CompactRentalForm } from '@/components/rental-wizard/compact-rental-form';
import { Loader2 } from 'lucide-react';

function FormLoading() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function RentPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Rent Equipment</h1>
        <p className="text-sm text-muted-foreground">
          Select your equipment and rental period
        </p>
      </div>

      <Suspense fallback={<FormLoading />}>
        <CompactRentalForm />
      </Suspense>
    </div>
  );
}
