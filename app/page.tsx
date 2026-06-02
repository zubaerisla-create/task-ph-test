import { redirect } from 'next/navigation';
import { getSession } from './_lib/auth';

export default async function RootPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
