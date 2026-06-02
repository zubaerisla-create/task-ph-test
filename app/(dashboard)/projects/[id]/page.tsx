import { getSession } from '@/app/_lib/auth';
import ProjectDetailClient from './_client';

export const metadata = { title: 'Project Detail — CollabFlow' };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  return <ProjectDetailClient session={session!} projectId={id} />;
}
