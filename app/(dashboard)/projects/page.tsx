import { getSession } from '@/app/_lib/auth';
import ProjectsClient from './_client';

export const metadata = { title: 'Projects — Task Track' };

export default async function ProjectsPage() {
  const session = await getSession();
  return <ProjectsClient session={session!} />;
}
