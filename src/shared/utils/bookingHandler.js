const { sendSMS } = require('./sendSMS');
const { supabaseAdmin } = require('../lib/supabase');

async function handleNewBooking(booking) {
  // Send to client
  if (booking.client_phone && booking.client_carrier && booking.client_sms_notifications) {
    await sendSMS({
      phoneNumber: booking.client_phone,
      carrier: booking.client_carrier,
      message: `Booking confirmed for ${booking.booking_time}`,
    });
  }
  // Send to barber
  if (booking.barber_phone && booking.barber_carrier && booking.barber_sms_notifications) {
    await sendSMS({
      phoneNumber: booking.barber_phone,
      carrier: booking.barber_carrier,
      message: `New booking: ${booking.client_name} at ${booking.booking_time}`,
    });
  }
  // Mark confirmation sent
  await supabaseAdmin
    .from('booking_texts')
    .update({ confirmation_sent: true })
    .eq('id', booking.id);
}

module.exports = { handleNewBooking }; 