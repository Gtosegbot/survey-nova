import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// N8N Webhook - PRIORITY 1
async function sendWhatsAppN8N(to: string, message: string): Promise<any> {
  console.log('💬 Sending WhatsApp via N8N webhook...');
  
  const N8N_WEBHOOK = Deno.env.get('N8N_WEBHOOK') || 'https://disparoseguro.app.n8n.cloud/webhook/send-whatsapp';
  
  const response = await fetch(N8N_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: to,
      message: message,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`N8N webhook failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

interface WhatsAppProvider {
  id: string;
  type: 'official' | 'evolution' | 'baileys';
  apiKey?: string;
  baseUrl: string;
  phoneNumberId?: string;
  accessToken?: string;
  isActive: boolean;
  rateLimitPerMinute: number;
  lastUsed?: number;
}

// WhatsApp providers configuration
const whatsappProviders: WhatsAppProvider[] = [
  {
    id: 'official',
    type: 'official',
    baseUrl: 'https://graph.facebook.com/v18.0',
    phoneNumberId: Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '',
    accessToken: Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '',
    isActive: true,
    rateLimitPerMinute: 80 // WhatsApp Business API limit
  },
  {
    id: 'evolution1',
    type: 'evolution',
    baseUrl: Deno.env.get('EVOLUTION_API_URL_1') || '',
    apiKey: Deno.env.get('EVOLUTION_API_KEY_1') || '',
    isActive: true,
    rateLimitPerMinute: 30
  },
  {
    id: 'evolution2',
    type: 'evolution',
    baseUrl: Deno.env.get('EVOLUTION_API_URL_2') || '',
    apiKey: Deno.env.get('EVOLUTION_API_KEY_2') || '',
    isActive: true,
    rateLimitPerMinute: 30
  }
];

// Rate limiting
const usageTracker = new Map<string, number[]>();

const isRateLimited = (providerId: string, limit: number): boolean => {
  const now = Date.now();
  const windowStart = now - 60000;
  
  const requests = usageTracker.get(providerId) || [];
  const recentRequests = requests.filter(time => time > windowStart);
  
  usageTracker.set(providerId, recentRequests);
  
  return recentRequests.length >= limit;
};

const addRequest = (providerId: string): void => {
  const requests = usageTracker.get(providerId) || [];
  requests.push(Date.now());
  usageTracker.set(providerId, requests);
};

const getNextProvider = (): WhatsAppProvider | null => {
  const activeProviders = whatsappProviders.filter(p => p.isActive && 
    (p.type === 'official' ? p.accessToken && p.phoneNumberId : p.apiKey && p.baseUrl));
  
  for (const provider of activeProviders) {
    if (!isRateLimited(provider.id, provider.rateLimitPerMinute)) {
      return provider;
    }
  }
  
  return null;
};

const sendWhatsAppOfficial = async (provider: WhatsAppProvider, to: string, message: string): Promise<any> => {
  const url = `${provider.baseUrl}/${provider.phoneNumberId}/messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''), // Remove non-digits
      type: 'text',
      text: {
        body: message
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp Official API error: ${response.status} ${errorText}`);
  }

  return await response.json();
};

const sendWhatsAppEvolution = async (provider: WhatsAppProvider, to: string, message: string): Promise<any> => {
  const url = `${provider.baseUrl}/message/sendText`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': provider.apiKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: to.replace(/\D/g, ''),
      textMessage: {
        text: message
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Evolution API error: ${response.status} ${errorText}`);
  }

  return await response.json();
};

const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (!cleaned.startsWith('55') && cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, to, message, bulk_messages } = await req.json();

    if (action === 'send_single') {
      if (!to || !message) {
        throw new Error('Phone number and message are required');
      }

      const formattedPhone = formatPhoneNumber(to);
      
      // Try N8N webhook first
      try {
        const result = await sendWhatsAppN8N(formattedPhone, message);
        console.log('✅ WhatsApp sent via N8N webhook');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            provider: 'n8n-webhook',
            result 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (n8nError) {
        console.error('❌ N8N webhook failed, trying fallback providers:', n8nError);
        
        // Fallback to existing providers
        const provider = getNextProvider();
        if (!provider) {
          throw new Error('All WhatsApp providers are rate limited or unavailable');
        }

        console.log(`Using WhatsApp provider: ${provider.id} (${provider.type})`);
        
        addRequest(provider.id);

        let result;

        switch (provider.type) {
          case 'official':
            result = await sendWhatsAppOfficial(provider, formattedPhone, message);
            break;
          case 'evolution':
            result = await sendWhatsAppEvolution(provider, formattedPhone, message);
            break;
          default:
            throw new Error(`Unsupported provider type: ${provider.type}`);
        }

        console.log(`WhatsApp message sent successfully via ${provider.id}`);

        return new Response(JSON.stringify({
          success: true,
          provider_used: provider.id,
          message_id: result.messages?.[0]?.id || result.key?.id || 'unknown',
          result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } else if (action === 'send_bulk') {
      if (!bulk_messages || !Array.isArray(bulk_messages)) {
        throw new Error('bulk_messages array is required');
      }

      const results = [];
      const failed = [];

      for (let i = 0; i < bulk_messages.length; i++) {
        const { to, message } = bulk_messages[i];
        
        try {
          const provider = getNextProvider();
          if (!provider) {
            failed.push({ to, error: 'No available providers' });
            continue;
          }

          addRequest(provider.id);
          const formattedPhone = formatPhoneNumber(to);
          
          let result;
          switch (provider.type) {
            case 'official':
              result = await sendWhatsAppOfficial(provider, formattedPhone, message);
              break;
            case 'evolution':
              result = await sendWhatsAppEvolution(provider, formattedPhone, message);
              break;
            default:
              throw new Error(`Unsupported provider type: ${provider.type}`);
          }

          results.push({
            to: formattedPhone,
            success: true,
            provider: provider.id,
            message_id: result.messages?.[0]?.id || result.key?.id || 'unknown'
          });

          // Rate limiting delay
          if (i < bulk_messages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }

        } catch (error) {
          console.error(`Failed to send to ${to}:`, error);
          failed.push({ to, error: error.message });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        total: bulk_messages.length,
        sent: results.length,
        failed: failed.length,
        results,
        failed_messages: failed
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'status') {
      // Return provider status
      const status = whatsappProviders.map(provider => ({
        id: provider.id,
        type: provider.type,
        isActive: provider.isActive,
        isConfigured: provider.type === 'official' 
          ? !!(provider.accessToken && provider.phoneNumberId)
          : !!(provider.apiKey && provider.baseUrl),
        rateLimitPerMinute: provider.rateLimitPerMinute,
        currentUsage: (usageTracker.get(provider.id) || []).length
      }));

      return new Response(JSON.stringify({ providers: status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error('Invalid action. Use: send_single, send_bulk, or status');
    }

  } catch (error) {
    console.error('WhatsApp Dispatcher Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});