import { NextResponse } from 'next/server';
import { getSession } from '../../_lib/auth';
import { proxyRequest, makeAvatar } from '../../_lib/api';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await proxyRequest('/activities');
    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: result.status });
    }

    const raw = (result.data as any)?.data ?? result.data;
    const rawLogs: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.logs ?? []);

    const logs = rawLogs.map((log: any) => ({
      id: log.id,
      message: log.message ?? log.action ?? '',
      createdAt: log.createdAt,
      type: 'activity',
      user: null, // Backend activity logs don't carry user details
    }));

    return NextResponse.json({ logs });
  } catch (err) {
    console.error('[GET /api/activity]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
