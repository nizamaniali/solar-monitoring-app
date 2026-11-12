import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_BROTHER_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://yrvialdowmlguhjrbazs.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_BROTHER_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_AUAS3Ho7VUASD2a5919kVQ_kQO9TQIG';

export const supabaseBrother = createClient(supabaseUrl.replace(/;$/, '').trim(), supabaseAnonKey.trim());
