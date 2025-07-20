const nodemailer = require('nodemailer');

const CARRIER_GATEWAYS = {
  verizon: 'vtext.com',
  att: 'txt.att.net',
  tmobile: 'tmomail.net',
  sprint: 'messaging.sprintpcs.com',
  boost: 'sms.myboostmobile.com',
  uscellular: 'email.uscc.net',
  cricket: 'sms.cricketwireless.net',
  metro: 'mymetropcs.com',
  googlefi: 'msg.fi.google.com',
  // Add more as needed
};

function getSmsAddress(phone, carrier) {
  const domain = CARRIER_GATEWAYS[carrier.toLowerCase()];
  if (!domain) throw new Error('Unsupported carrier');
  return `${phone.replace(/\D/g, '')}@${domain}`;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendSMS({ phoneNumber, carrier, message }) {
  try {
    const to = getSmsAddress(phoneNumber, carrier);
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject: '',
      text: message,
    };
    
    console.log('Attempting to send SMS:', { to, from: process.env.GMAIL_USER });
    await transporter.sendMail(mailOptions);
    console.log(`SMS sent successfully to ${phoneNumber} (${carrier})`);
    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

// Enhanced function to send booking confirmation SMS
async function sendBookingConfirmationSMS(bookingData) {
  const { booking, barber, service, client } = bookingData;
  
  console.log('🔍 Starting SMS confirmation for booking:', booking.id);
  console.log('📋 Booking data received:', {
    bookingId: booking.id,
    barber: {
      id: barber?.id,
      phone: barber?.phone,
      carrier: barber?.carrier,
      sms_notifications: barber?.sms_notifications
    },
    client: {
      id: client?.id,
      phone: client?.phone,
      carrier: client?.carrier,
      sms_notifications: client?.sms_notifications
    },
    service: {
      id: service?.id,
      name: service?.name
    }
  });

  // Get barber's profile data (SMS data and name) from profiles table
  let barberSmsData = null;
  let barberName = null;
  if (barber && barber.user_id) {
    console.log('🔍 Fetching barber profile data from profiles table...');
    try {
      const { supabaseAdmin } = require('../lib/supabase');
      const { data: barberProfile, error } = await supabaseAdmin
        .from('profiles')
        .select('phone, carrier, sms_notifications, first_name, last_name')
        .eq('id', barber.user_id)
        .single();
      
      if (!error && barberProfile) {
        barberSmsData = {
          phone: barberProfile.phone,
          carrier: barberProfile.carrier,
          sms_notifications: barberProfile.sms_notifications
        };
        barberName = `${barberProfile.first_name} ${barberProfile.last_name}`.trim();
        console.log('✅ Retrieved barber profile data:', { smsData: barberSmsData, name: barberName });
      } else {
        console.log('❌ Failed to fetch barber profile data from profiles:', error);
      }
    } catch (error) {
      console.error('❌ Error fetching barber profile data:', error);
    }
  }
  
  try {
    const bookingDate = new Date(booking.date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = bookingDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const results = [];

    // Send SMS to client if they have SMS notifications enabled
    console.log('👤 Checking client SMS prerequisites:', {
      hasClient: !!client,
      hasPhone: !!client?.phone,
      hasCarrier: !!client?.carrier,
      smsEnabled: client?.sms_notifications
    });
    
    if (client && client.phone && client.carrier && client.sms_notifications) {
      console.log('✅ Client SMS prerequisites met - sending SMS');
      const barberDisplayName = barberName || 'Your Barber';
      const clientMessage = `🎉 Booking Confirmed!\n\nService: ${service.name}\nDate: ${formattedDate}\nTime: ${formattedTime}\nBarber: ${barberDisplayName}\n\nSee you there!`;
      
      try {
        console.log('📤 Attempting to send client SMS to:', client.phone, 'via', client.carrier);
        await sendSMS({
          phoneNumber: client.phone,
          carrier: client.carrier,
          message: clientMessage
        });
        results.push({ recipient: 'client', success: true });
        console.log('✅ Client SMS sent successfully');
      } catch (error) {
        console.error('❌ Failed to send client SMS:', error);
        results.push({ recipient: 'client', success: false, error: error.message });
      }
    } else {
      console.log('❌ Client SMS prerequisites NOT met:', {
        hasClient: !!client,
        hasPhone: !!client?.phone,
        hasCarrier: !!client?.carrier,
        smsEnabled: client?.sms_notifications
      });
    }

    // Send SMS to barber if they have SMS notifications enabled
    const barberPhone = barberSmsData?.phone || barber?.phone;
    const barberCarrier = barberSmsData?.carrier || barber?.carrier;
    const barberSmsEnabled = barberSmsData?.sms_notifications || barber?.sms_notifications;
    
    console.log('💇 Checking barber SMS prerequisites:', {
      hasPhone: !!barberPhone,
      hasCarrier: !!barberCarrier,
      smsEnabled: barberSmsEnabled,
      source: barberSmsData ? 'profiles' : 'barber'
    });
    
    if (barberPhone && barberCarrier && barberSmsEnabled) {
      const clientName = client ? (client.name || client.first_name + ' ' + client.last_name) : (booking.guest_name || 'Guest');
      const barberMessage = `📅 New Booking!\n\nClient: ${clientName}\nService: ${service.name}\nDate: ${formattedDate}\nTime: ${formattedTime}\n\nBooking ID: ${booking.id}`;
      
      try {
        console.log('📤 Attempting to send barber SMS to:', barberPhone, 'via', barberCarrier);
        await sendSMS({
          phoneNumber: barberPhone,
          carrier: barberCarrier,
          message: barberMessage
        });
        results.push({ recipient: 'barber', success: true });
        console.log('✅ Barber SMS sent successfully');
      } catch (error) {
        console.error('❌ Failed to send barber SMS:', error);
        results.push({ recipient: 'barber', success: false, error: error.message });
      }
    }

    console.log('✅ SMS confirmation completed. Results:', results);
    return results;
  } catch (error) {
    console.error('❌ Error in sendBookingConfirmationSMS:', error);
    throw error;
  }
}

// Enhanced function to send booking reminder SMS
async function sendBookingReminderSMS(bookingData) {
  const { booking, barber, service, client } = bookingData;
  
  // Get barber's name from profiles table
  let barberName = null;
  if (barber && barber.user_id) {
    try {
      const { supabaseAdmin } = require('../lib/supabase');
      const { data: barberProfile, error } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', barber.user_id)
        .single();
      
      if (!error && barberProfile) {
        barberName = `${barberProfile.first_name} ${barberProfile.last_name}`.trim();
      }
    } catch (error) {
      console.error('Error fetching barber name for reminder:', error);
    }
  }
  
  try {
    const bookingDate = new Date(booking.date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = bookingDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const results = [];

    // Send reminder to client
    if (client && client.phone && client.carrier && client.sms_notifications) {
      const barberDisplayName = barberName || 'Your Barber';
      const clientMessage = `⏰ Appointment Reminder!\n\nYour appointment is in 1 hour:\nService: ${service.name}\nTime: ${formattedTime}\nBarber: ${barberDisplayName}\n\nSee you soon!`;
      
      try {
        await sendSMS({
          phoneNumber: client.phone,
          carrier: client.carrier,
          message: clientMessage
        });
        results.push({ recipient: 'client', success: true });
      } catch (error) {
        console.error('Failed to send client reminder SMS:', error);
        results.push({ recipient: 'client', success: false, error: error.message });
      }
    }

    // Send reminder to barber
    if (barber.phone && barber.carrier && barber.sms_notifications) {
      const clientName = client ? (client.name || client.first_name + ' ' + client.last_name) : (booking.guest_name || 'Guest');
      const barberMessage = `⏰ Appointment Reminder!\n\nYou have an appointment in 1 hour:\nClient: ${clientName}\nService: ${service.name}\nTime: ${formattedTime}`;
      
      try {
        await sendSMS({
          phoneNumber: barber.phone,
          carrier: barber.carrier,
          message: barberMessage
        });
        results.push({ recipient: 'barber', success: true });
      } catch (error) {
        console.error('Failed to send barber reminder SMS:', error);
        results.push({ recipient: 'barber', success: false, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendBookingReminderSMS:', error);
    throw error;
  }
}

module.exports = { 
  sendSMS, 
  getSmsAddress, 
  CARRIER_GATEWAYS,
  sendBookingConfirmationSMS,
  sendBookingReminderSMS
}; 