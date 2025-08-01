// supabase/functions/get-all-users/index.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Fonction pour vérifier si un utilisateur est administrateur
async function isAdmin(supabaseClient: SupabaseClient, authHeader: string): Promise<boolean> {
  if (!authHeader) {
    return false;
  }
  
  try {
    // 1. Récupérer les informations de l'utilisateur à partir de son token
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    // 2. Vérifier si l'utilisateur existe et si ses métadonnées contiennent le rôle 'admin'
    //    IMPORTANT : Vous devez définir ce rôle dans Supabase pour vos utilisateurs admin.
    return user?.user_metadata?.role === 'admin';

  } catch (error) {
    console.error("Erreur lors de la vérification de l'utilisateur:", error);
    return false;
  }
}


serve(async (req) => {
  // Gérer la requête pre-flight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Créer un client Supabase qui peut vérifier les permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Extraire le token d'authentification de l'en-tête
    const authHeader = req.headers.get('Authorization')!;

    // Vérifier si l'utilisateur est un administrateur en utilisant notre nouvelle fonction
    const isUserAdmin = await isAdmin(supabaseAdmin, authHeader);

    if (!isUserAdmin) {
      // Si l'utilisateur n'est pas un admin, renvoyer une erreur 403 (Interdit)
      return new Response(JSON.stringify({ error: 'Accès refusé. Requiert le rôle admin.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Si l'utilisateur EST un admin, alors exécuter la logique pour lister les utilisateurs
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw error
    }

    // Renvoyer la liste des utilisateurs
    return new Response(JSON.stringify(users), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(String(error?.message ?? error), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
