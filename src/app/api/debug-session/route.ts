import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug session endpoint called');
    
    // Get all cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Filter for session-related cookies
    const sessionCookies = allCookies.filter(cookie => 
      cookie.name.includes('session') || 
      cookie.name.includes('auth') || 
      cookie.name.includes('supabase') ||
      cookie.name.startsWith('sb-')
    );
    
    console.log('🍪 All cookies found:', allCookies.map(c => c.name));
    console.log('🔐 Session cookies found:', sessionCookies.map(c => c.name));
    
    // Try to get session using Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    // First try getSession
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    let user: any = session?.user || null;
    let userError = sessionError;
    
    console.log('📋 Session check:', { 
      hasSession: !!session, 
      sessionError: sessionError?.message,
      userId: session?.user?.id 
    });
    
    // If no session from cookies, try to get user directly
    if (!user) {
      const { data: { user: directUser }, error: directUserError } = await supabase.auth.getUser();
      user = directUser;
      userError = directUserError;
    }
    
    // If still no user, check if we have an authorization header
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        console.log('🔐 Debug session - Using Bearer token for authentication');
        
        // Create a new Supabase client with the token
        const { createClient } = await import('@supabase/supabase-js');
        const tokenClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        );
        
        const { data: { user: tokenUser }, error: tokenError } = await tokenClient.auth.getUser();
        user = tokenUser;
        userError = tokenError;
      }
    }
    
    console.log('👤 User check:', { 
      hasUser: !!user, 
      userError: userError?.message,
      userId: user?.id 
    });
    
    // Check if we can access the database
    let dbAccess = false;
    let dbError = null;
    
    if (user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', user.id)
          .single();
        
        dbAccess = !profileError && !!profile;
        dbError = profileError?.message;
        
        console.log('🗄️ Database access check:', { 
          dbAccess, 
          dbError,
          profileFound: !!profile 
        });
      } catch (dbTestError) {
        dbError = dbTestError instanceof Error ? dbTestError.message : 'Unknown error';
        console.error('❌ Database test failed:', dbTestError);
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cookies: {
        total: allCookies.length,
        sessionCookies: sessionCookies.map(c => c.name),
        allCookieNames: allCookies.map(c => c.name)
      },
      session: {
        hasSession: !!session,
        sessionError: sessionError?.message,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at
      },
      user: {
        hasUser: !!user,
        userError: userError?.message,
        userId: user?.id,
        email: user?.email
      },
      database: {
        canAccess: dbAccess,
        error: dbError
      },
      summary: {
        isAuthenticated: !!user && !userError,
        hasValidSession: !!session && !sessionError,
        canAccessDatabase: dbAccess
      }
    });

  } catch (error) {
    console.error('❌ Debug session error:', error);
    return NextResponse.json(
      { 
        error: 'Debug session failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
