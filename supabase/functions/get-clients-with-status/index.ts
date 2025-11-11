import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key (has admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the user from the auth header
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch all clients
    const { data: allClients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) throw clientsError;

    // Fetch all profiles for these clients
    const userIds = allClients?.map(client => client.user_id) || [];

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          clients: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, full_name, role, is_active')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    // Create a map of profiles by user_id for easy lookup
    const profilesMap = new Map(
      profiles?.map(profile => [profile.user_id, profile]) || []
    );

    // Merge clients with their profiles
    const clients = allClients?.map(client => ({
      ...client,
      profiles: profilesMap.get(client.user_id) || null,
    })).filter(client => client.profiles && client.profiles.role === 'client');

    // Get all auth users to check confirmation status
    const {
      data: { users },
      error: usersError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) throw usersError;

    // Map clients with their confirmation status
    const clientsWithStatus = clients?.map(client => {
      const authUser = users?.find(u => u.id === client.user_id);
      const isConfirmed = !!authUser?.email_confirmed_at;

      return {
        ...client,
        invitation_status: isConfirmed ? 'confirmed' : 'pending',
        email_confirmed_at: authUser?.email_confirmed_at || null,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        clients: clientsWithStatus || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching clients:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
