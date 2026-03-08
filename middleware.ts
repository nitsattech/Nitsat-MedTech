import { NextRequest, NextResponse } from 'next/server';

const roleAccess: Record<string, string[]> = {
  admin: [
    '/dashboard',
    '/opd-flow',
    '/ipd-workflow',
    '/patients',
    '/billing',
    '/pharmacy',
    '/investigations',
    '/mis',
  ],
  doctor: ['/opd-flow', '/patients'],
  receptionist: ['/opd-flow', '/patients'],
  lab_technician: ['/investigations'],
  pharmacist: ['/pharmacy'],
  accountant: ['/billing'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const userRole = request.cookies.get('userRole')?.value;

  // 🔐 Not logged in → login page
  if (!userRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 👑 Admin = Full HMS access
  if (userRole === 'admin') {
    return NextResponse.next();
  }

  const allowedRoutes = roleAccess[userRole] || [];

  const isAllowed = allowedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isAllowed) {
    // Role wise redirect (Real HMS logic)
    switch (userRole) {
      case 'doctor':
      case 'receptionist':
        return NextResponse.redirect(new URL('/opd-flow', request.url));

      case 'lab_technician':
        return NextResponse.redirect(new URL('/investigations', request.url));

      case 'pharmacist':
        return NextResponse.redirect(new URL('/pharmacy', request.url));

      case 'accountant':
        return NextResponse.redirect(new URL('/billing', request.url));

      default:
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/opd-flow/:path*',
    '/ipd-workflow/:path*',
    '/patients/:path*',
    '/billing/:path*',
    '/pharmacy/:path*',
    '/investigations/:path*',
    '/mis/:path*',
  ],
};