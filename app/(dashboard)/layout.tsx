import { redirect } from 'next/navigation';
import { getSession } from '@/app/_lib/auth';
import Sidebar from './_components/Sidebar';
import TopBar from './_components/TopBar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar user={session} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar user={session} />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
