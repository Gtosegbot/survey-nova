import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOKS = {
  email: 'https://workwebhook.disparoseguro.com/webhook/send-email',
  sms: 'https://workwebhook.disparoseguro.com/webhook/send-sms',
  whatsapp: 'https://workwebhook.disparoseguro.com/webhook/send-whatsapp',
  voip: 'https://workwebhook.disparoseguro.com/webhook/livekit',
  aiChat: 'https://workwebhook.disparoseguro.com/webhook/db8e97f8-21d6-4bc3-a3ea-10cc77a44e6e/chat'
};

const CHANNEL_COSTS = {
  email: { dispatch: 0.05, response: 1.00 },
  sms: { dispatch: 0.15, response: 1.00 },
  whatsapp: { dispatch: 1.00, response: 3.00 },
  voip: { dispatch: 2.50, response: 3.00 }
};

interface DispatchRequest {
  channel: 'email' | 'sms' | 'whatsapp' | 'voip' | 'aiChat';
  recipients: Array<{
    name: string;
    contact: string; // email, phone, or whatsapp number
  }>;
  message: {
    subject?: string;
    content: string;
    surveyLink?: string;
  };
  campaignId?: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: DispatchRequest = await req.json();
    const { channel, recipients, message, campaignId, userId } = requestData;

    console.log(`🚀 Dispatching via ${channel} to ${recipients.length} recipients`);

    // Calcular custo total do disparo
    const channelCost = CHANNEL_COSTS[channel as keyof typeof CHANNEL_COSTS];
    if (!channelCost) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    const totalDispatchCost = recipients.length * channelCost.dispatch;

    // Verificar saldo de créditos
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    if (creditsError || !credits) {
      return new Response(JSON.stringify({
        error: 'Unable to verify credits balance'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (credits.current_balance < totalDispatchCost) {
      return new Response(JSON.stringify({
        error: 'Insufficient credits',
        required: totalDispatchCost,
        available: credits.current_balance
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Deduzir créditos pelo disparo
    const { error: debitError } = await supabase.rpc('update_user_credits', {
      p_user_id: userId,
      p_amount: -totalDispatchCost,
      p_transaction_type: 'deduction',
      p_service_type: `${channel}_dispatch`,
      p_description: `Disparo de ${recipients.length} mensagens via ${channel}`,
      p_reference_id: campaignId || null
    });

    if (debitError) {
      console.error('❌ Credit debit error:', debitError);
      throw new Error('Failed to debit credits');
    }

    // Preparar payload para n8n
    const webhookUrl = N8N_WEBHOOKS[channel];
    const results = [];

    for (const recipient of recipients) {
      try {
        const payload = {
          channel,
          recipient: {
            name: recipient.name,
            contact: recipient.contact
          },
          message: {
            subject: message.subject || '',
            content: message.content,
            surveyLink: message.surveyLink || ''
          },
          metadata: {
            campaignId: campaignId || null,
            userId,
            timestamp: new Date().toISOString()
          }
        };

        console.log(`📤 Sending to n8n webhook: ${webhookUrl}`);
        
        const n8nResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const n8nResult = await n8nResponse.json();
        
        results.push({
          recipient: recipient.contact,
          status: n8nResponse.ok ? 'sent' : 'failed',
          response: n8nResult
        });

        // Log de auditoria
        if (channel === 'sms') {
          await supabase.from('sms_logs').insert({
            user_id: userId,
            phone: recipient.contact,
            message: message.content,
            status: n8nResponse.ok ? 'sent' : 'failed',
            cost: channelCost.dispatch,
            campaign_id: campaignId,
            provider_response: n8nResult
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error sending to ${recipient.contact}:`, errorMessage);
        results.push({
          recipient: recipient.contact,
          status: 'error',
          error: errorMessage
        });
      }
    }

    // Atualizar estatísticas da campanha se houver campaignId
    if (campaignId) {
      const successCount = results.filter(r => r.status === 'sent').length;
      await supabase
        .from('campaigns')
        .update({
          sent_count: successCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status !== 'sent').length;

    console.log(`✅ Dispatch complete: ${successCount} sent, ${failedCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      channel,
      totalRecipients: recipients.length,
      successCount,
      failedCount,
      costDebited: totalDispatchCost,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ n8n-dispatcher Error:', errorMessage);
    
    return new Response(JSON.stringify({
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
