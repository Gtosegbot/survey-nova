import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { name, type, survey_id, message, scheduled_for, contact_ids } = await req.json();

    // Create campaign
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .insert({
        user_id: user.id,
        name,
        type,
        survey_id,
        message,
        scheduled_for,
        status: scheduled_for ? 'scheduled' : 'draft',
        target_audience: { contact_ids }
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    console.log('✅ Campaign created:', campaign.id);

    return new Response(JSON.stringify({ campaign }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Campaign creation error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Campaign creation failed'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
