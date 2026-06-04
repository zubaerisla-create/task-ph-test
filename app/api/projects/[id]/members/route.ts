import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../_lib/auth';
import { proxyRequest } from '../../../../_lib/api';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'team_member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await ctx.params;
    const { memberId, userId, action } = await req.json();

    const targetMemberId = memberId ?? userId;
    if (!targetMemberId) {
      return NextResponse.json({ error: 'memberId or userId is required' }, { status: 400 });
    }

    const endpoint = action === 'remove'
      ? `/projects/${id}/remove-member`
      : `/projects/${id}/add-member`;

    const result = await proxyRequest(endpoint, {
      method: 'POST',
      body: { memberId: targetMemberId },
    });

    const data = result.data as any;
    if (!result.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to manage member' }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/projects/[id]/members]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
