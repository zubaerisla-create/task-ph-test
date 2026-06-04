import { redirect } from 'next/navigation';
import { getSession } from '@/app/_lib/auth';
import LayoutWrapper from './_components/LayoutWrapper';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <LayoutWrapper user={session}>
      {children}
    </LayoutWrapper>
  );
}
