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

    const { campaign_id } = await req.json();

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('*, surveys(*)')
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) throw new Error('Campaign not found');

    // Get contacts
    const contactIds = campaign.target_audience?.contact_ids || [];
    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('*')
      .in('id', contactIds)
      .eq('user_id', user.id);

    if (contactsError) throw contactsError;

    // Update campaign status
    await supabaseClient
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign_id);

    // Dispatch based on type
    const results = await Promise.allSettled(
      contacts.map(contact => dispatchToContact(contact, campaign, supabaseClient))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    // Update campaign metrics
    await supabaseClient
      .from('campaigns')
      .update({
        sent_count: successCount,
        status: 'completed'
      })
      .eq('id', campaign_id);

    console.log(`✅ Campaign dispatched: ${successCount}/${contacts.length} sent`);

    return new Response(JSON.stringify({ 
      success: true,
      sent: successCount,
      total: contacts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Dispatch error:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Dispatch failed'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function dispatchToContact(contact: any, campaign: any, supabaseClient: any) {
  // Generate unique survey link
  const linkId = crypto.randomUUID().split('-')[0];
  
  const { data: surveyLink } = await supabaseClient
    .from('survey_links')
    .insert({
      survey_id: campaign.survey_id,
      created_by: campaign.user_id,
      link_id: linkId,
      channel_type: campaign.type,
      recipient: contact.email || contact.phone
    })
    .select()
    .single();

  const surveyUrl = `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://app.')}/survey/${linkId}`;
  
  // Replace placeholders in message
  let message = campaign.message;
  message = message.replace(/{nome}/g, contact.name);
  message = message.replace(/{link}/g, surveyUrl);

  // Dispatch based on type
  switch (campaign.type) {
    case 'email':
      await supabaseClient.functions.invoke('email-dispatcher', {
        body: {
          to: contact.email,
          subject: `Pesquisa: ${campaign.surveys.title}`,
          message,
          campaign_id: campaign.id
        }
      });
      break;
      
    case 'sms':
      await supabaseClient.functions.invoke('sms-dispatcher', {
        body: {
          phone: contact.phone,
          message,
          campaign_id: campaign.id
        }
      });
      break;
      
    case 'whatsapp':
      await supabaseClient.functions.invoke('whatsapp-dispatcher', {
        body: {
          phone: contact.phone,
          message,
          campaign_id: campaign.id
        }
      });
      break;
  }

  return { success: true, contact: contact.id };
}
