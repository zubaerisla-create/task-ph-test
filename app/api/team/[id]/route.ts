import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../_lib/auth';
import { proxyRequest } from '../../../_lib/api';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await ctx.params;
    const result = await proxyRequest(`/users/${id}`, { method: 'DELETE' });
    const data = result.data as any;

    if (!result.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to delete user' }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/team/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await ctx.params;
    const { role } = await req.json();

    const result = await proxyRequest(`/users/role/${id}`, {
      method: 'PATCH',
      body: { role: role.toUpperCase() },
    });
    const data = result.data as any;

    if (!result.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to change role' }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/team/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
