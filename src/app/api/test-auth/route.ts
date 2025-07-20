import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Test auth endpoint called');
    
    // Get current user using the auth helpers
    const supabase = createRouteHandlerClient({ cookies });
    
    // First, let's check what cookies are available
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('All cookies found:', allCookies.map(c => c.name));
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('Auth check result:', { user: user?.id, error: userError });
    
    if (userError) {
      console.error('User error:', userError);
      return NextResponse.json(
        { error: 'Authentication error', details: userError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 