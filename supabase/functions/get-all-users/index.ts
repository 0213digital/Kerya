import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Edge Function "get-all-users" is running')

Deno.serve(async (req) => {
  // This is a preflight request. It's a check that the browser sends before the actual request.
  // We need to handle it and respond with the correct headers.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the user's authorization to check who is calling the function.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the authenticated user.
    const { data: { user } } = await supabaseClient.auth.getUser()

    // If no user is authenticated, return an error.
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // IMPORTANT: Check if the authenticated user is an admin.
    // Replace this with your actual admin user ID.
    const adminUserId = '08116ec7-be3f-43fb-a7c8-c1e76c9540de';
    if (user.id !== adminUserId) {
      return new Response(JSON.stringify({ error: 'Forbidden: Not an admin' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // If the user is an admin, create a new client with the service_role key
    // to bypass Row Level Security and fetch all user data.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch all users from the auth schema to get IDs, emails, and creation dates.
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 2. Fetch all corresponding profiles from the public schema.
    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('*');
    if (profilesError) throw profilesError;

    // 3. Merge the two datasets.
    // Create a map of profiles for efficient lookup using the user ID as the key.
    const profilesMap = new Map(profiles.map(p => [p.id, p]));

    // Combine the authentication data with the profile data.
    const combinedUsers = authUsers.map(authUser => {
      const profile = profilesMap.get(authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        // Get profile data if it exists, otherwise use sensible defaults.
        full_name: profile?.full_name ?? 'N/A',
        avatar_url: profile?.avatar_url ?? null,
        is_agency_owner: profile?.is_agency_owner ?? false,
        is_suspended: profile?.is_suspended ?? false,
      };
    });

    // Return the complete list of users with the correct CORS headers.
    return new Response(JSON.stringify(combinedUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in Edge Function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})