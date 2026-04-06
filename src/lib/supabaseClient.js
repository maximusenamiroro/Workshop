import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey ? "exists" : "MISSING");

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (...args) => {
      return fetch(...args).catch((err) => {
        console.warn("Network error, retrying in 3s...", err.message);
        return new Promise((resolve) =>
          setTimeout(() => resolve(fetch(...args)), 3000)
        );
      });
    },
  },
});