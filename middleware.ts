import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware auth error:', error)
      // Clear any invalid session data
      await supabase.auth.signOut()
      return res
    }

    // Add session to response headers for client-side access
    if (session) {
      res.headers.set('x-session-user', session.user.id)
      res.headers.set('x-session-role', session.user.user_metadata.role || 'client')
    }

    // Handle auth callback
    if (req.nextUrl.pathname === '/auth/callback') {
      const { searchParams } = req.nextUrl
      const code = searchParams.get('code')
      const next = searchParams.get('next') || '/'

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          return NextResponse.redirect(new URL(next, req.url))
        }
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// Specify which routes should be handled by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 