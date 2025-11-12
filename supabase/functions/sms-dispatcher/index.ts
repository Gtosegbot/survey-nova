import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// N8N Webhook - PRIORITY 1
async function sendSmsN8N(to: string, message: string, id?: string): Promise<any> {
  console.log('📱 Sending SMS via N8N webhook...');
  
  const N8N_WEBHOOK = 'https://disparoseguro.app.n8n.cloud/webhook/send-sms';
  
  const response = await fetch(N8N_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: to,
      message: message,
      id: id || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`N8N webhook failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

// SMS DO BRASIL API Configuration - FALLBACK
class SmsDoBrasilAPI {
  private baseURL = 'https://disparo.smsdobrasil.com.br/api/v2';
  private authHeader: string;
  private defaultHeaders: Record<string, string>;

  constructor(usuario: string, senha: string) {
    if (!usuario || !senha) {
      throw new Error('Usuário e senha são obrigatórios para a API SMS DO BRASIL.');
    }
    
    const credentials = `${usuario}:${senha}`;
    this.authHeader = `Basic ${btoa(credentials)}`;
    
    this.defaultHeaders = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async sendSingleSms(to: string, message: string, id: string = crypto.randomUUID()): Promise<any> {
    console.log(`Enviando SMS para ${to} com ID: ${id}`);
    
    const url = `${this.baseURL}/sms/`;
    const payload = {
      sendSmsRequest: {
        to,
        message,
        id
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Erro ${response.status}`);
      }
      
      console.log('SMS enviado com sucesso:', responseData);
      return responseData;
    } catch (error) {
      console.error('Erro ao enviar SMS único:', error);
      throw error;
    }
  }

  async sendMultiSms(messages: Array<{to: string, message: string, id: string}>, campaignId?: string): Promise<any> {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("A lista de mensagens não pode estar vazia.");
    }
    console.log(`Enviando um lote de ${messages.length} SMS...`);

    const url = `${this.baseURL}/sms/multi/`;
    const payload: any = {
      sendSmsMultiRequest: {
        sendSmsRequestList: messages
      }
    };

    if (campaignId) {
      payload.sendSmsMultiRequest.campaignId = campaignId;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Erro ${response.status}`);
      }

      console.log('Lote de SMS processado:', responseData);
      return responseData;
    } catch (error) {
      console.error('Erro ao enviar SMS em lote:', error);
      throw error;
    }
  }

  async checkStatus(id: string): Promise<any> {
    if (!id) {
      throw new Error("O ID do SMS é obrigatório para consulta.");
    }
    console.log(`Consultando status do SMS com ID: ${id}`);

    const url = `${this.baseURL}/sms/?id=${id}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Erro ${response.status}`);
      }

      console.log('Status recebido:', responseData.message[0]);
      return responseData;
    } catch (error) {
      console.error('Erro ao consultar status do SMS:', error);
      throw error;
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorização necessária');
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { action, ...payload } = await req.json();

    // Buscar credenciais SMS DO BRASIL
    const smsUser = Deno.env.get('smsdobrasil_user');
    const smsPass = Deno.env.get('smsdobrasil_pass');

    if (!smsUser || !smsPass) {
      throw new Error('Credenciais SMS DO BRASIL não configuradas');
    }

    const smsApi = new SmsDoBrasilAPI(smsUser, smsPass);

    let result;

    switch (action) {
      case 'send_single':
        const { phone, message, reference_id } = payload;
        const smsId = reference_id || crypto.randomUUID();
        
        console.log(`📱 Sending single SMS to ${phone}`);
        
        // Try N8N webhook first
        let provider = 'n8n-webhook';
        
        try {
          result = await sendSmsN8N(phone, message, smsId);
          console.log('✅ SMS sent via N8N webhook');
        } catch (n8nError) {
          console.error('❌ N8N webhook failed, trying SMS DO BRASIL:', n8nError);
          // Fallback to SMS DO BRASIL
          result = await smsApi.sendSingleSms(phone, message, smsId);
          provider = 'sms-do-brasil';
        }
        
        // Salvar no banco de dados
        await supabase.from('sms_logs').insert({
          user_id: user.id,
          phone,
          message,
          reference_id: smsId,
          status: 'sent',
          provider_response: result,
          cost: 0.15 // Custo configurável
        });

        // Debitar créditos do usuário
        await supabase.rpc('update_user_credits', {
          p_user_id: user.id,
          p_amount: -0.15,
          p_transaction_type: 'deduction',
          p_service_type: 'sms',
          p_description: `SMS enviado para ${phone} via ${provider}`,
          p_reference_id: smsId
        });
        
        break;

      case 'send_bulk':
        const { messages, campaign_id } = payload;
        result = await smsApi.sendMultiSms(messages, campaign_id);
        
        // Calcular custo total
        const totalCost = messages.length * 0.15;
        
        // Salvar logs em batch
        const smsLogs = messages.map((msg: any) => ({
          user_id: user.id,
          phone: msg.to,
          message: msg.message,
          reference_id: msg.id,
          campaign_id,
          status: 'sent',
          cost: 0.15
        }));
        
        await supabase.from('sms_logs').insert(smsLogs);
        
        // Debitar créditos
        await supabase.rpc('update_user_credits', {
          p_user_id: user.id,
          p_amount: -totalCost,
          p_transaction_type: 'deduction',
          p_service_type: 'sms_bulk',
          p_description: `SMS em lote - ${messages.length} mensagens`,
          p_reference_id: campaign_id
        });
        
        break;

      case 'check_status':
        const { sms_id } = payload;
        result = await smsApi.checkStatus(sms_id);
        
        // Atualizar status no banco
        await supabase
          .from('sms_logs')
          .update({ 
            status: result.message[0]?.status || 'unknown',
            delivery_info: result.message[0]
          })
          .eq('reference_id', sms_id)
          .eq('user_id', user.id);
        
        break;

      default:
        throw new Error('Ação não reconhecida');
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro SMS Dispatcher:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);