import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Você é um assistente especializado em metodologia de pesquisa. Seu objetivo é coletar informações COMPLETAS antes de criar uma pesquisa.

IMPORTANTE - COLETA DE INFORMAÇÕES OBRIGATÓRIA:
Você DEVE coletar TODAS as informações abaixo antes de informar que a pesquisa está pronta:

1. TEMA: O assunto da pesquisa
2. PÚBLICO-ALVO: Quem deve responder (ex: eleitores de São Paulo, clientes de 25-45 anos)
3. LOCALIZAÇÃO: Onde será aplicada (cidade, estado, região)
4. TAMANHO DA AMOSTRA: Quantas pessoas devem responder
5. PERGUNTAS ESPECÍFICAS: Para pesquisas políticas, perguntar os candidatos. Para produtos, perguntar características.
6. METODOLOGIA: Como será aplicada (presencial, online, telefone)

REGRAS:
- Faça UMA pergunta por vez
- Seja conversacional e amigável
- Confirme cada informação coletada
- NÃO crie a pesquisa até ter TODAS as informações acima
- Para pesquisas políticas, SEMPRE pergunte os nomes dos candidatos
- Para pesquisas de produto, SEMPRE pergunte características específicas
- Ao final, resuma TUDO coletado e pergunte se está correto
- Só diga que a pesquisa está pronta após confirmação do usuário

JAMAIS simule disparadores ou campanhas. A pesquisa será criada no banco de dados real.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    console.log('🤖 AI Creator: Processing request with', messages.length, 'messages');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const messagesWithSystem = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messagesWithSystem,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ AI Response received successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ AI Creator Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'AI processing failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});