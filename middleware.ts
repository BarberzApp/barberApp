import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  await supabase.auth.getSession()

  return res
}

export const config = {
  matcher: [
    '/api/barbers/:path*',
    '/api/bookings/:path*',
    '/api/reviews/:path*',
    '/api/services/:path*',
    '/api/availability/:path*',
    '/api/notifications/:path*',
    '/api/analytics/:path*',
    '/api/portfolio/:path*',
    '/api/specialties/:path*',
    '/api/earnings/:path*',
    '/api/clients/:path*',
    '/api/settings/:path*',
    '/api/profile/:path*',
    '/api/auth/:path*',
  ],
} 