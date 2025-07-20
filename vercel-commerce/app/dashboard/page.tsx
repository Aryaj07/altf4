import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardClient } from 'components/dashboard/dashboard-client';
import { Suspense } from 'react';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  // Redirect to login if no token found
  if (!token) {
    redirect('/login');
  }

  // Wrap client component in Suspense
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardClient token={token} />
    </Suspense>
  );
}