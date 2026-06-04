import { getSession } from '@/app/_lib/auth';
import ActivityClient from './_client';

export const metadata = { title: 'Activity Log — Task Track' };

export default async function ActivityPage() {
  const session = await getSession();
  return <ActivityClient session={session!} />;
}
