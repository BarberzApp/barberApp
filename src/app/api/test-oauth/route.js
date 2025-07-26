import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic OAuth URL generation
    const testUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}`;
    
    return NextResponse.json({
      success: true,
      message: 'OAuth configuration test',
      details: {
        clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'Missing',
        testUrl: testUrl,
        isLocalhost: process.env.GOOGLE_REDIRECT_URI?.includes('localhost') || false
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
} 