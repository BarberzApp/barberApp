import { NextResponse } from 'next/server';
import { sendSMS } from '@/shared/utils/sendSMS';

export async function POST(req) {
  try {
    console.log('🧪 Direct SMS test starting...');

    // Test sending SMS directly to the client phone number
    const testMessage = `🎉 Booking Confirmed!\n\nService: Quick cut\nDate: Thursday, July 24, 2025\nTime: 2:24 PM\nBarber: Yassy Cuts\n\nSee you there!`;

    console.log('📤 Attempting to send direct SMS to: 9083407527 via verizon');
    
    await sendSMS({ 
      phoneNumber: '9083407527', 
      carrier: 'verizon', 
      message: testMessage 
    });

    console.log('✅ Direct SMS sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Direct SMS test completed successfully',
      details: {
        phoneNumber: '9083407527',
        carrier: 'verizon',
        messageLength: testMessage.length
      }
    });

  } catch (error) {
    console.error('❌ Direct SMS test error:', error);
    return NextResponse.json({ 
      error: 'Direct SMS test failed',
      details: error.message 
    }, { status: 500 });
  }
} 