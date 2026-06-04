import { getSession } from '@/app/_lib/auth';
import TeamClient from './_client';

export const metadata = { title: 'Team — Task Track' };

export default async function TeamPage() {
  const session = await getSession();
  return <TeamClient session={session!} />;
}
