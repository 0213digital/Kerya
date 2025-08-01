import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Function is active (cold start).");

// Define more explicit CORS headers.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, you might want to restrict this to your app's domain.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Explicitly state allowed methods.
};

serve(async (req) => {
  // Log every incoming request to help with debugging.
  console.log(`Request received: Method=${req.method}, URL=${req.url}`);

  // This is the most critical part. It handles the browser's preflight check.
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request and sending 204 response.");
    // A 204 No Content response is standard and correct for preflight requests.
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log("Proceeding with main function logic for a non-OPTIONS request.");
    
    // Safely read the request body as text first.
    const requestBodyText = await req.text();
    if (!requestBodyText) {
      console.error("Error: Request body was empty.");
      throw new Error("Request body is empty and cannot be parsed as JSON.");
    }

    // Now that we know the body is not empty, parse it.
    console.log("Request body is not empty, attempting to parse JSON.");
    const body = JSON.parse(requestBodyText);
    const { userId } = body;
    
    if (!userId) {
      console.error("Error: Parsed body did not contain a userId.");
      throw new Error("User ID is required in the request body.");
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
      throw new Error("Server configuration error.");
    }

    // Create an admin client.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    console.log(`Attempting to sign out user with ID: ${userId}`);

    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId);

    if (signOutError) {
      console.error("Supabase admin.signOut() error:", signOutError.message);
      throw signOutError;
    }

    console.log(`Successfully signed out user: ${userId}`);
    
    return new Response(JSON.stringify({ message: `User ${userId} signed out successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("An error was caught in the main try/catch block:", error.message);
    return new Response(JSON.stringify({ error: error.message || 'An unknown server error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  } finally {
    // This log will run regardless of whether there was an error or not.
    // If you see this in your logs, the new code is active.
    console.log("Function execution finished.");
  }
});
