import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Você é um assistente especializado em criar pesquisas de opinião e satisfação.

Quando o usuário descrever uma pesquisa, você deve gerar um JSON estruturado com:

{
  "title": "Título da pesquisa",
  "description": "Descrição detalhada",
  "target_sample_size": 100,
  "questions": [
    {
      "id": "q1",
      "type": "single|multiple|text|scale",
      "title": "Pergunta",
      "options": ["Opção 1", "Opção 2"],
      "required": true
    }
  ],
  "mandatory_questions": {
    "location": {
      "title": "Qual sua localização?",
      "options": ["São Paulo", "Rio de Janeiro", "Outros"],
      "enabled": true
    },
    "gender": {
      "title": "Qual seu sexo?",
      "options": ["Masculino", "Feminino", "Outro"],
      "enabled": true
    },
    "age": {
      "title": "Qual sua faixa etária?",
      "options": ["16-24", "25-34", "35-44", "45-59", "60+"],
      "enabled": true
    }
  }
}

REGRAS:
1. Gere entre 5-15 perguntas relevantes ao tema
2. Use tipos variados: single (única escolha), multiple (múltipla), text (aberta), scale (1-5)
3. Sempre inclua as perguntas obrigatórias de localização, gênero e idade
4. Adapte as opções de localização ao contexto da pesquisa
5. Retorne APENAS o JSON, sem explicações adicionais
6. Não seja tendencioso nas perguntas - mantenha neutralidade
7. Inclua perguntas de validação para detectar respostas inconsistentes`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🤖 Creating survey for user ${userId}: "${prompt.substring(0, 100)}..."`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Crie uma pesquisa sobre: ${prompt}` }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('No response from AI');
    }

    console.log('✅ AI response received');

    // Extract JSON from response
    let surveyData;
    try {
      // Try to parse as JSON directly
      surveyData = JSON.parse(aiContent);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        surveyData = JSON.parse(jsonMatch[1].trim());
      } else {
        // Last resort: find JSON object in text
        const jsonStart = aiContent.indexOf('{');
        const jsonEnd = aiContent.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          surveyData = JSON.parse(aiContent.substring(jsonStart, jsonEnd));
        } else {
          throw new Error('Could not parse survey JSON');
        }
      }
    }

    console.log(`✅ Survey created: ${surveyData.title}`);

    return new Response(JSON.stringify({ 
      success: true,
      survey: surveyData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ai-survey-creator Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
