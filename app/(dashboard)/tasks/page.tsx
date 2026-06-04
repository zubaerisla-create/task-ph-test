import { getSession } from '@/app/_lib/auth';
import TasksClient from './_client';

export const metadata = { title: 'Tasks — Task Track' };

export default async function TasksPage() {
  const session = await getSession();
  return <TasksClient session={session!} />;
}
