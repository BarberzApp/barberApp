const { sendBookingReminderSMS } = require('./sendSMS');
const { supabaseAdmin } = require('../lib/supabase');

async function checkReminders() {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  console.log('Checking for bookings between:', now.toISOString(), 'and', inOneHour.toISOString());

  // Get bookings that are confirmed and within the next hour
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      barber:barber_id(*),
      service:service_id(*),
      client:client_id(*)
    `)
    .eq('status', 'confirmed')
    .gte('date', now.toISOString())
    .lte('date', inOneHour.toISOString());

  if (error) {
    console.error('Error fetching bookings for reminders:', error);
    throw error;
  }

  console.log(`Found ${bookings?.length || 0} bookings that need reminders`);

  for (const booking of bookings || []) {
    try {
      console.log(`Processing reminder for booking ${booking.id}`);
      
      // Send reminder SMS to both client and barber
      const smsResults = await sendBookingReminderSMS(booking);
      console.log(`Reminder SMS results for booking ${booking.id}:`, smsResults);

      // Optionally, you could mark that reminders were sent in the database
      // This would require adding a reminder_sent field to the bookings table
      
    } catch (error) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, error);
    }
  }
  
  console.log(`Reminder check completed at ${now.toISOString()}`);
}

module.exports = { checkReminders }; 