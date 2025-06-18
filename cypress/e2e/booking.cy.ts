/// <reference types="cypress" />

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      env(key: string): string
    }
  }
}

describe('Booking Flow', () => {
  beforeEach(() => {
    // Log in as a test user or set up test data
    cy.visit('/booking')
  })

  it('should create a booking and process payment', () => {
    // Select a barber and service
    cy.get('[data-testid="barber-select"]').select('Test Barber')
    cy.get('[data-testid="service-select"]').select('Test Service')

    // Fill in booking details
    cy.get('[data-testid="date-picker"]').type('2023-12-01')
    cy.get('[data-testid="time-slot"]').click()

    // Submit the booking form
    cy.get('[data-testid="submit-booking"]').click()

    // Verify Stripe Checkout appears
    cy.url().should('include', 'checkout.stripe.com')

    // Use Stripe test card
    cy.get('input[name="cardNumber"]').type('4242424242424242')
    cy.get('input[name="expiry"]').type('1225')
    cy.get('input[name="cvc"]').type('123')

    // Submit payment
    cy.get('button[type="submit"]').click()

    // Verify success page
    cy.url().should('include', '/booking/success')
    cy.contains('Booking Confirmed').should('be.visible')

    // Verify Supabase records (optional, via API)
    cy.request({
      method: 'GET',
      url: '/rest/v1/bookings?select=*&order=created_at.desc&limit=1',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
      },
    }).its('body.0.payment_status').should('eq', 'succeeded')
  })
}) 