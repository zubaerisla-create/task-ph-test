import { getSession } from '@/app/_lib/auth';
import DashboardClient from './_client';

export const metadata = { title: 'Dashboard — CollabFlow' };

export default async function DashboardPage() {
  const session = await getSession();
  return <DashboardClient session={session!} />;
}
