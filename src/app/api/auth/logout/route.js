import { NextResponse } from 'next/server';
import {
  deleteSession,
  getExpiredSessionCookieOptions,
  getSessionCookieName,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  await deleteSession(request);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), '', getExpiredSessionCookieOptions());
  response.headers.set('Cache-Control', 'no-store');

  return response;
}
