import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Determine system prompt based on context
function getSystemPrompt(systemContext?: any): string {
  // Survey creation mode
  if (!systemContext?.survey_id) {
    return `Você é um assistente especializado em metodologia de pesquisa estatisticamente válida.

OBJETIVO: Coletar informações completas antes de criar a pesquisa.

PRIMEIRA MENSAGEM OBRIGATÓRIA:
Responda exatamente: "Olá! Vou te ajudar a criar uma pesquisa profissional. 

Para começar, preciso que você me descreva em detalhes o que quer descobrir com essa pesquisa. Inclua:
- Tema principal (ex: intenção de voto, satisfação com produto, etc.)
- Quem deve responder (público-alvo)
- Onde será aplicada (cidade, estado, região)
- Quantas pessoas precisam responder
- Perguntas específicas que quer fazer
- Tipo: política, mercado, produto, satisfação, opinião pública, etc.

Quanto mais detalhes você fornecer, melhor será sua pesquisa!"

COLETA DE INFORMAÇÕES (após primeira mensagem):
1. Analise a resposta inicial do usuário
2. Identifique campos OBRIGATÓRIOS faltantes:
   - Pesquisa POLÍTICA → EXIGIR nomes completos dos candidatos/partidos
   - Pesquisa PRODUTO → EXIGIR nome e características do produto
   - Pesquisa MERCADO → EXIGIR segmento e objetivos específicos
   - SEMPRE: localização exata (cidade/estado)
   - SEMPRE: número exato de participantes
   - SEMPRE: perguntas específicas que o usuário quer fazer

3. Faça perguntas objetivas, UMA POR VEZ
4. Confirme cada informação coletada
5. VARIE suas respostas - nunca repita as mesmas frases
6. Use linguagem natural e conversacional
7. Seja específico: "Quais são os nomes dos candidatos?" em vez de "preciso de mais informações"

APÓS COLETAR TODAS AS INFORMAÇÕES:
1. Resuma TUDO que foi coletado de forma clara
2. Pergunte: "Está tudo correto? Posso criar a pesquisa com essas informações?"
3. Aguarde confirmação do usuário
4. Apenas após confirmação, responda EXATAMENTE: "CRIAR_PESQUISA_AGORA"

REGRAS CRÍTICAS:
- NUNCA crie pesquisa sem TODAS as informações obrigatórias
- NUNCA simule disparos ou campanhas
- NUNCA repita as mesmas frases genéricas
- SEMPRE varie sua forma de perguntar
- SEMPRE confirme antes de criar
- Pesquisa política SEM candidatos = INCOMPLETA`;
  }

  // Survey response mode - conversational research
  const survey = systemContext;
  return `Você é um pesquisador profissional conduzindo a pesquisa: "${survey.survey_title}"

INFORMAÇÕES DA PESQUISA:
${survey.mandatory_questions ? `Perguntas Obrigatórias: ${JSON.stringify(survey.mandatory_questions)}` : ''}
${survey.questions ? `Perguntas da Pesquisa: ${JSON.stringify(survey.questions)}` : ''}

OBJETIVO: Conduzir uma pesquisa conversacional SEM VIÉS, coletando respostas válidas.

REGRAS CRÍTICAS DE IMPARCIALIDADE:
1. NUNCA induza respostas ou mostre preferência por opções
2. NUNCA use linguagem que favoreça um candidato/produto/opção
3. SEMPRE seja neutro e objetivo
4. EVITE adjetivos positivos/negativos ao mencionar opções
5. Apresente todas as opções com a MESMA neutralidade

FORMATO DAS PERGUNTAS:
1. Faça perguntas ABERTAS quando apropriado (ex: "O que você pensa sobre...?")
2. Faça perguntas FECHADAS com opções claras (ex: "Escolha uma opção: A, B, C")
3. VARIE entre abertas e fechadas para manter engajamento
4. Use escala Likert quando apropriado (1-5, muito insatisfeito a muito satisfeito)
5. Permita respostas espontâneas sem forçar escolhas

FLUXO DA CONVERSA:
1. Comece perguntando dados demográficos OBRIGATÓRIOS de forma simples e direta:
   - Nome completo
   - Idade (opcional)
   - Localização: PERGUNTE DE FORMA SIMPLES:
     * "Em qual cidade você mora?" 
     * "Qual é o seu bairro?"
     * "De onde você está respondendo?"
   - NUNCA mencione "candidato" ou qualquer opção de resposta nesta fase
   - NUNCA diga "use as 3 opções"
   - Seja DIRETO e CLARO nas perguntas de localização
2. Após coletar dados demográficos, apresente cada pergunta da pesquisa de forma natural
3. Peça esclarecimentos se resposta for vaga
4. NÃO repita perguntas já respondidas
5. Confirme entendimento antes de avançar
6. Ao final, resuma as respostas e peça confirmação

RESPOSTAS COLETADAS ATÉ AGORA:
${JSON.stringify(survey.collected_responses || {}, null, 2)}

QUANDO PESQUISA COMPLETA:
Quando TODAS as perguntas forem respondidas e confirmadas, responda com JSON:
{
  "survey_complete": true,
  "collected_data": {
    "name": "nome completo",
    "email": "email se fornecido",
    "phone": "telefone se fornecido", 
    "demographics": { "age": X, "location": "cidade, bairro" },
    "answers": { "pergunta1": "resposta1", "pergunta2": "resposta2" }
  }
}

IMPORTANTE: Seja humano, empático e conversacional. Mostre interesse genuíno nas respostas.`;
}

interface AIProvider {
  name: string;
  type: 'groq' | 'openai' | 'lovable';
  apiKey: string;
  endpoint: string;
  model: string;
  priority: number;
}

async function callGroq(messages: any[], apiKey: string, model: string) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function callOpenAI(messages: any[], apiKey: string, model: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function callLovableAI(messages: any[], apiKey: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Lovable AI error: ${response.status} - ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, system_context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    console.log('🤖 AI Multi-Rotation: Processing request with', messages.length, 'messages');
    console.log('📋 System context:', system_context ? 'Survey response mode' : 'Survey creation mode');

    const systemPrompt = getSystemPrompt(system_context);
    
    const messagesWithSystem = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Get API keys
    const groqKeys = [
      Deno.env.get('GROQ_API_KEY_1'),
      Deno.env.get('GROQ_API_KEY_2'),
      Deno.env.get('GROQ_API_KEY_3'),
      Deno.env.get('GROQ_API_KEY_4'),
      Deno.env.get('GROQ_API_KEY_5'),
    ].filter(Boolean);

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    // Build providers list with priority
    const providers: AIProvider[] = [];

    // Priority 1: Groq with llama-3.3-70b-versatile (5 keys for rotation)
    groqKeys.forEach((key, index) => {
      if (key) {
        providers.push({
          name: `Groq-${index + 1}`,
          type: 'groq',
          apiKey: key,
          endpoint: 'https://api.groq.com/openai/v1/chat/completions',
          model: 'llama-3.3-70b-versatile',
          priority: 1 + index * 0.1, // 1.0, 1.1, 1.2, 1.3, 1.4
        });
      }
    });

    // Priority 2: OpenAI models (if available)
    if (openaiKey) {
      providers.push(
        {
          name: 'OpenAI-Nano',
          type: 'openai',
          apiKey: openaiKey,
          endpoint: 'https://api.openai.com/v1/chat/completions',
          model: 'gpt-5-nano',
          priority: 2,
        },
        {
          name: 'OpenAI-Mini',
          type: 'openai',
          apiKey: openaiKey,
          endpoint: 'https://api.openai.com/v1/chat/completions',
          model: 'gpt-4.1-mini',
          priority: 3,
        }
      );
    }

    // Priority 3: Lovable AI (fallback)
    if (lovableKey) {
      providers.push({
        name: 'Lovable-AI',
        type: 'lovable',
        apiKey: lovableKey,
        endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
        model: 'google/gemini-2.5-flash',
        priority: 4,
      });
    }

    if (providers.length === 0) {
      throw new Error('No AI providers configured');
    }

    // Sort by priority
    providers.sort((a, b) => a.priority - b.priority);

    console.log('📋 Available providers:', providers.map(p => p.name).join(', '));

    // Try each provider in order
    let lastError: Error | null = null;
    
    for (const provider of providers) {
      try {
        console.log(`🔄 Trying ${provider.name} (${provider.model})...`);
        
        let data;
        if (provider.type === 'groq') {
          data = await callGroq(messagesWithSystem, provider.apiKey, provider.model);
        } else if (provider.type === 'openai') {
          data = await callOpenAI(messagesWithSystem, provider.apiKey, provider.model);
        } else if (provider.type === 'lovable') {
          data = await callLovableAI(messagesWithSystem, provider.apiKey);
        }

        console.log(`✅ Success with ${provider.name}`);
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, error.message);
        lastError = error as Error;
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);

  } catch (error) {
    console.error('❌ AI Multi-Rotation Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'AI processing failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
