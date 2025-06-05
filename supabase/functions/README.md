# Supabase Edge Functions

This directory contains Edge Functions for the Barber App. Edge Functions are serverless functions that run on Supabase's infrastructure.

## Available Functions

- `auth-webhook`: Handles authentication webhooks
- `booking-notification`: Sends notifications for booking events
- `payment-webhook`: Processes payment webhooks from Stripe

## Development

To develop Edge Functions locally:

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Start the local development environment:
   ```bash
   supabase start
   ```

3. Create a new function:
   ```bash
   supabase functions new my-function
   ```

4. Deploy a function:
   ```bash
   supabase functions deploy my-function
   ```

## Testing

To test functions locally:

```bash
supabase functions serve my-function
```

## Environment Variables

Functions can access environment variables set in the Supabase dashboard under Settings > Functions. 