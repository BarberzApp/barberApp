import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Simple session check called');
    
    // Just check what cookies are available without making auth calls
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Look for any session-related cookies
    const sessionCookies = allCookies.filter(cookie => 
      cookie.name.includes('session') || 
      cookie.name.includes('auth') || 
      cookie.name.includes('supabase') ||
      cookie.name.startsWith('sb-')
    );
    
    return NextResponse.json({
      success: true,
      message: 'Session check completed safely',
      cookieCount: allCookies.length,
      sessionCookies: sessionCookies.map(c => c.name),
      allCookieNames: allCookies.map(c => c.name)
    });

  } catch (error) {
    console.error('Simple session check error:', error);
    return NextResponse.json(
      { error: 'Session check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 