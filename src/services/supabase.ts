
import { SupabaseClient, createClient } from '@supabase/supabase-js';

let supabase: SupabaseClient<any, "public", any>;

export function initSupabase() {
  const supabaseUrl = 'https://phjfdmfelaagxneduomf.supabase.co';
  const supabaseKey = process.env.SUPABASE_KEY as string;
  supabase = createClient<Database>(supabaseUrl, supabaseKey);
}

export { supabase };