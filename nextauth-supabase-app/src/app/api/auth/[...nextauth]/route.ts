import { NextAuthOptions } from "next-auth";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";
import NextAuth from "next-auth";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const authOptions: NextAuthOptions = {
  providers: [
    // Add your providers here
  ],
  adapter: SupabaseAdapter(supabase),
  // Additional NextAuth options can be added here
};

export default NextAuth(authOptions);