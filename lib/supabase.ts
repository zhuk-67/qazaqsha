import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dzekvpqrbgyqfpwpcmcz.supabase.co';
const supabaseAnonKey = 'sb_publishable_UM3MYaqzNePtQz-Fx8Lujg_hHeUdPGj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);