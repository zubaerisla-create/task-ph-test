import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession } from '../../_lib/auth';
import { proxyRequest, normalizeRole, makeAvatar } from '../../_lib/api';
import type { SessionUser } from '../../_lib/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await proxyRequest('/users/me');
    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: result.status });
    }

    const raw = (result.data as any)?.data ?? result.data;
    return NextResponse.json({
      user: {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        role: normalizeRole(raw.role),
        avatar: makeAvatar(raw.name ?? ''),
        profilePicture: raw.profilePicture ?? '',
      },
    });
  } catch (err) {
    console.error('[GET /api/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = req.headers.get('content-type') ?? '';
    let result;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      result = await proxyRequest('/users/update-profile', { method: 'PATCH', body: formData });
    } else {
      const body = await req.json();
      result = await proxyRequest('/users/update-profile', { method: 'PATCH', body });
    }

    const data = result.data as any;

    if (!result.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to update profile' }, { status: result.status });
    }

    const updated = data?.data ?? data;
    // Refresh session with updated name and profile picture
    const newSession: SessionUser = {
      ...session,
      name: updated.name ?? session.name,
      avatar: makeAvatar(updated.name ?? session.name),
      profilePicture: updated.profilePicture ?? session.profilePicture,
    };
    await setSession(newSession);

    return NextResponse.json({ ok: true, user: newSession });
  } catch (err) {
    console.error('[PATCH /api/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
