import { NextResponse } from 'next/server';
import { supabase } from '@/shared/lib/supabase';

interface UpdateStatusRequest {
  barberId: string;
  accountId: string;
}

export async function POST(request: Request) {
  try {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }

    const body = await request.json() as UpdateStatusRequest;
    const { barberId, accountId } = body;

    // Input validation
    if (!barberId || !accountId) {
      return NextResponse.json(
        { error: 'Barber ID and Account ID are required' },
        { status: 400, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }}
      )
    }

    // Update the barber's Stripe account status
    const { error: updateError } = await supabase
      .from('barbers')
      .update({
        stripe_account_id: accountId,
        stripe_account_status: 'active',
        stripe_account_ready: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', barberId);

    if (updateError) {
      console.error('Error updating barber:', updateError);
      return NextResponse.json(
        { error: 'Failed to update barber status' },
        { status: 500, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }}
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe account status updated successfully',
      barberId,
      accountId,
    }, { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }})
  } catch (error) {
    console.error('Error updating Stripe status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update Stripe status' },
      {
        status: 500, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
}
