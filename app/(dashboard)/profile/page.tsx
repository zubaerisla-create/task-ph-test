import { getSession } from '@/app/_lib/auth';
import ProfileClient from './_client';

export const metadata = { title: 'My Profile — CollabFlow' };

export default async function ProfilePage() {
  const session = await getSession();
  return <ProfileClient session={session!} />;
}
