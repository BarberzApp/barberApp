import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      prompt: 'consent',
      include_granted_scopes: true
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Get tokens from Google
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Save connection to database
    const { data: connection, error: connectionError } = await supabase
      .from('user_calendar_connections')
      .upsert({
        user_id: user.id,
        provider: 'google_calendar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        calendar_id: 'primary',
        sync_enabled: true,
        sync_direction: 'bidirectional',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,provider' })
      .select()
      .single();

    if (connectionError) {
      console.error('Error saving calendar connection:', connectionError);
      return NextResponse.json(
        { error: 'Failed to save calendar connection' },
        { status: 500 }
      );
    }

    // Log successful connection
    await supabase
      .from('calendar_sync_logs')
      .insert({
        user_id: user.id,
        connection_id: connection.id,
        operation: 'connect',
        status: 'success',
        details: { provider: 'google_calendar' }
      });

    return NextResponse.json({ 
      success: true, 
      message: 'Google Calendar connected successfully',
      connection: {
        id: connection.id,
        provider: connection.provider,
        sync_enabled: connection.sync_enabled,
        sync_direction: connection.sync_direction
      }
    });

  } catch (error) {
    console.error('Error in Google Calendar OAuth callback:', error);
    return NextResponse.json(
      { error: 'Failed to complete authentication' },
      { status: 500 }
    );
  }
} 