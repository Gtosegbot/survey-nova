import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Você é um assistente especializado em metodologia de pesquisa. 

PRIMEIRA INTERAÇÃO OBRIGATÓRIA:
Na PRIMEIRA mensagem do usuário, você DEVE responder EXATAMENTE:
"Antes de criar sua pesquisa, preciso que você descreva em um prompt detalhado tudo que você quer saber na pesquisa. 

Por favor, inclua:
- Tema da pesquisa
- Quem deve responder (público-alvo)
- Onde será aplicada (localização)
- Quantas pessoas (tamanho da amostra)
- Perguntas específicas que quer fazer
- Como será aplicada (presencial, online, telefone, etc.)

Quanto mais detalhado você for, melhor ficará sua pesquisa!"

APÓS RECEBER O PROMPT DETALHADO:
Analise o prompt e identifique informações faltantes:
- Se for pesquisa POLÍTICA: exija os nomes dos candidatos
- Se for pesquisa de PRODUTO: exija características do produto
- Se for pesquisa de MERCADO: exija segmento e objetivos
- Sempre confirme localização específica (cidade/estado/região)
- Sempre confirme o número exato de participantes

REGRAS DE COLETA:
- Faça UMA pergunta por vez para informações faltantes
- Seja conversacional e amigável
- Confirme cada informação coletada
- NÃO crie a pesquisa até ter TODAS as informações
- Ao final, resuma TUDO coletado e pergunte se está correto
- Só responda "CRIAR_PESQUISA_AGORA" após confirmação do usuário

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
      error: error instanceof Error ? error.message : 'AI processing failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});