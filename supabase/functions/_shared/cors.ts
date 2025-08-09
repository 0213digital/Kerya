export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specify your app's domain for production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT', // Allow all common methods
}