import { redirect } from 'next/navigation';
import { getSession } from '@/app/_lib/auth';
import UserManagementClient from './_client';


export const metadata = { title: 'User Management — Task Track' };

export default async function UserManagementPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/dashboard');
  }
  return <UserManagementClient session={session} />;
}
