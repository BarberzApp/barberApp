import { NextResponse } from 'next/server';
import { checkReminders } from '@/shared/utils/reminderJob';

export async function POST() {
  try {
    console.log('Manual reminder check triggered');
    await checkReminders();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Reminder check completed successfully' 
    });
  } catch (error) {
    console.error('Error in reminder check:', error);
    return NextResponse.json(
      { error: 'Failed to check reminders' },
      { status: 500 }
    );
  }
} 