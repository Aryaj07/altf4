import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AccountProvider } from 'components/account/account-context';
import { DashboardClient } from 'components/dashboard/dashboard-client';

export default async function Page() {
  // Add 'await' here to resolve the promise returned by cookies()
  const cookieStore = await cookies(); 
  const token = cookieStore.get('auth_token')?.value;

  // Redirect to login if no token found
  if (!token) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountProvider token={token}>
        <DashboardClient />
      </AccountProvider>
    </Suspense>
  );
}