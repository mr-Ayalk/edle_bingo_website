import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE, roleDashboardPath, type SessionPayload } from '@/lib/auth';
import { getJwtSecretBytes, isJwtConfigured } from '@/lib/jwt-secret';

const PUBLIC_PATHS = [
  '/',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/settings/public',
  '/api/vouchers/status',
  '/api/vouchers/mark-used',
];

async function readSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV === 'production' && !isJwtConfigured()) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Server misconfigured.' }, { status: 503 });
    }
    return new NextResponse('Server misconfigured.', { status: 503 });
  }

  const session = await readSession(request);
  const isApi = pathname.startsWith('/api/');

  if (!session) {
    if (isApi) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/dashboard/owner') && session.role !== 'OWNER') {
    return NextResponse.redirect(new URL(roleDashboardPath(session.role), request.url));
  }
  if (pathname.startsWith('/dashboard/agent') && session.role !== 'AGENT') {
    return NextResponse.redirect(new URL(roleDashboardPath(session.role), request.url));
  }
  if (pathname.startsWith('/dashboard/downloads') && session.role !== 'DOWNLOADER') {
    return NextResponse.redirect(new URL(roleDashboardPath(session.role), request.url));
  }

  if (pathname.startsWith('/api/') && pathname.includes('/owner') && session.role !== 'OWNER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const response = NextResponse.next();
  response.headers.set('x-user-role', session.role);
  response.headers.set('x-user-id', session.sub);
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
