import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Clave publishable moderna (sb_publishable_...). Segura para el frontend:
// el acceso real lo controla RLS en Supabase.
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. Copia .env.example a .env y define ' +
      'VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
