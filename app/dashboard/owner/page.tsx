import { Suspense } from 'react';
import OwnerDashboardClient from './OwnerDashboardClient';

export const dynamic = 'force-dynamic';

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={null}>
      <OwnerDashboardClient />
    </Suspense>
  );
}
