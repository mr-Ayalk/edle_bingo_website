import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createToken, AUTH_COOKIE, roleDashboardPath, serializeUser } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { getAppSettings, ensureAppSettings } from '@/lib/settings';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 });
    }

    await ensureAppSettings();
    const settings = await getAppSettings();

    if (username === settings.downloadUsername) {
      const valid = await verifyPassword(password, settings.downloadPasswordHash);
      if (valid) {
        const token = await createToken({
          sub: 'downloader',
          username: settings.downloadUsername,
          role: 'DOWNLOADER',
          name: 'Download Portal',
        });
        const response = NextResponse.json({
          user: {
            username: settings.downloadUsername,
            role: 'DOWNLOADER',
            name: 'Download Portal',
          },
          redirect: roleDashboardPath('DOWNLOADER'),
        });
        response.cookies.set(AUTH_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ message: 'Invalid username or password.' }, { status: 401 });
    }

    const token = await createToken({
      sub: String(user.id),
      username: user.username,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      user: serializeUser(user),
      redirect: roleDashboardPath(user.role),
    });

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Login failed.' }, { status: 500 });
  }
}
