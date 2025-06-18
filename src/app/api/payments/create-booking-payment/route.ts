import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/shared/lib/supabase';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

const supabase = supabaseAdmin;

export async function POST(req: Request) {
  try {
    // Accept all booking and guest info
    const { barberId, serviceId, date, notes, guestName, guestEmail, guestPhone, clientId } = await req.json();

    if (!barberId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'barberId, serviceId, and date are required' },
        { status: 400 }
      );
    }

    // Look up the barber's Stripe account ID
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('stripe_account_id')
      .eq('id', barberId)
      .single();

    if (barberError || !barber?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Barber Stripe account not found or not ready' },
        { status: 400 }
      );
    }
    const barberStripeAccountId = barber.stripe_account_id;

    // Verify the barber's Stripe account is active
    const account = await stripe.accounts.retrieve(barberStripeAccountId);
    if (!account.charges_enabled) {
      return NextResponse.json(
        { error: 'Barber account is not ready to accept payments' },
        { status: 400 }
      );
    }

    // (Optional) Look up the service price
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('price')
      .eq('id', serviceId)
      .single();
    if (serviceError || !service?.price) {
      return NextResponse.json(
        { error: 'Service not found or missing price' },
        { status: 400 }
      );
    }
    const priceCents = Math.round(Number(service.price) * 100);
    // Example: 20% platform fee
    const platformFeeCents = Math.round(priceCents * 0.2);

    // Create a PaymentIntent with all booking/guest info in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceCents,
      currency: 'usd',
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: barberStripeAccountId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        barber_id: barberId,
        service_id: serviceId,
        date,
        notes: notes || '',
        guest_name: guestName || '',
        guest_email: guestEmail || '',
        guest_phone: guestPhone || '',
        client_id: clientId || '',
      },
    });

    // No booking is created yet; booking will be created in webhook after payment

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Error creating payment intent' },
      { status: 500 }
    );
  }
} 