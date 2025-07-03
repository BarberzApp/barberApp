import { NextRequest, NextResponse } from 'next/server';

// Use the provided Calendly link
const CALENDLY_LINK = 'https://calendly.com/primbocm/30min';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // --- Email sending logic ---
  // You can use Resend, Nodemailer, or any transactional email service here.
  // This is a stub for demonstration.
  try {
    // Example: using Resend (uncomment and configure if you have credentials)
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@bocm.app',
    //   to: email,
    //   subject: 'Book a 30 min call with BOCM',
    //   html: `<p>Need a 30 min call with us? Pick a spot on our Calendly:</p><p><a href="${CALENDLY_LINK}">${CALENDLY_LINK}</a></p>`
    // });

    // For now, just simulate a delay and return success
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
} 