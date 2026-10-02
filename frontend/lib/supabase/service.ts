import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security.
// Only use in trusted server-side code (webhook handlers, etc.).
// Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
