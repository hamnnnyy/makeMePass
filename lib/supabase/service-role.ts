import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

let serviceRoleClient: SupabaseClient<Database> | undefined;

function getSupabaseServiceConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).'
    );
  }

  return { supabaseUrl, supabaseServiceRoleKey };
}

export function createClient(): SupabaseClient<Database> {
  if (serviceRoleClient) {
    return serviceRoleClient;
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceConfig();

  serviceRoleClient = createSupabaseClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return serviceRoleClient;
}
