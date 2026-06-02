import { getSession } from '@/app/_lib/auth';
import AnalyticsClient from './_client';

export const metadata = { title: 'Analytics — CollabFlow' };

export default async function AnalyticsPage() {
  const session = await getSession();
  return <AnalyticsClient session={session!} />;
}
