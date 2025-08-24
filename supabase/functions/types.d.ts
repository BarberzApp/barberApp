// Deno globals for Supabase Edge Functions
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// Module declarations for Deno imports
declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): any;
}

declare module 'https://esm.sh/stripe@14.21.0?target=deno' {
  export default class Stripe {
    constructor(secretKey: string, options?: any);
    paymentIntents: any;
    checkout: any;
    accounts: any;
  }
}

export {};
