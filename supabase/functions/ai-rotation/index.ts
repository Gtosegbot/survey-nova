import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIProvider {
  id: string;
  type: 'groq' | 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  endpoint: string;
  model: string;
  maxTokens: number;
  isActive: boolean;
  lastUsed?: number;
  rateLimitPerMinute: number;
  currentUsage: number;
}

// AI Providers configuration with rotation
const aiProviders: AIProvider[] = [
  // Groq free accounts (primary rotation)
  {
    id: 'groq1',
    type: 'groq',
    apiKey: Deno.env.get('GROQ_API_KEY_1') || '',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-70b-8192',
    maxTokens: 8192,
    isActive: true,
    rateLimitPerMinute: 30,
    currentUsage: 0
  },
  {
    id: 'groq2',
    type: 'groq',
    apiKey: Deno.env.get('GROQ_API_KEY_2') || '',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-70b-8192',
    maxTokens: 8192,
    isActive: true,
    rateLimitPerMinute: 30,
    currentUsage: 0
  },
  {
    id: 'groq3',
    type: 'groq',
    apiKey: Deno.env.get('GROQ_API_KEY_3') || '',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'mixtral-8x7b-32768',
    maxTokens: 32768,
    isActive: true,
    rateLimitPerMinute: 30,
    currentUsage: 0
  },
  {
    id: 'groq4',
    type: 'groq',
    apiKey: Deno.env.get('GROQ_API_KEY_4') || '',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-70b-8192',
    maxTokens: 8192,
    isActive: true,
    rateLimitPerMinute: 30,
    currentUsage: 0
  },
  {
    id: 'groq5',
    type: 'groq',
    apiKey: Deno.env.get('GROQ_API_KEY_5') || '',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'gemma2-9b-it',
    maxTokens: 8192,
    isActive: true,
    rateLimitPerMinute: 30,
    currentUsage: 0
  },
  {
    id: 'groq6',
    type: 'groq',
    apiKey: Deno.env.get('GROQ_API_KEY_6') || '',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-70b-8192',
    maxTokens: 8192,
    isActive: true,
    rateLimitPerMinute: 30,
    currentUsage: 0
  },
  // Premium fallback providers
  {
    id: 'openai',
    type: 'openai',
    apiKey: Deno.env.get('OPENAI_API_KEY') || '',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    maxTokens: 16384,
    isActive: false, // Only activate when Groq fails
    rateLimitPerMinute: 60,
    currentUsage: 0
  },
  {
    id: 'anthropic',
    type: 'anthropic',
    apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
    maxTokens: 4096,
    isActive: false,
    rateLimitPerMinute: 50,
    currentUsage: 0
  },
  {
    id: 'gemini',
    type: 'gemini',
    apiKey: Deno.env.get('GEMINI_API_KEY') || '',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro',
    maxTokens: 8192,
    isActive: false,
    rateLimitPerMinute: 60,
    currentUsage: 0
  }
];

// Rate limiting tracking
const usageTracker = new Map<string, number[]>();

const isRateLimited = (providerId: string, limit: number): boolean => {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
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

const getNextProvider = (): AIProvider | null => {
  // First try Groq providers (free)
  const groqProviders = aiProviders.filter(p => p.type === 'groq' && p.apiKey);
  
  for (const provider of groqProviders) {
    if (!isRateLimited(provider.id, provider.rateLimitPerMinute)) {
      return provider;
    }
  }
  
  console.log('All Groq providers rate limited, falling back to premium providers');
  
  // Fallback to premium providers
  const premiumProviders = aiProviders.filter(p => p.type !== 'groq' && p.apiKey);
  
  for (const provider of premiumProviders) {
    if (!isRateLimited(provider.id, provider.rateLimitPerMinute)) {
      return provider;
    }
  }
  
  return null;
};

const callGroqAPI = async (provider: AIProvider, messages: any[]): Promise<any> => {
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      messages: messages,
      max_tokens: Math.min(provider.maxTokens, 4096),
      temperature: 0.7,
      stream: false
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

const callOpenAIAPI = async (provider: AIProvider, messages: any[]): Promise<any> => {
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      messages: messages,
      max_tokens: Math.min(provider.maxTokens, 4096),
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

const callAnthropicAPI = async (provider: AIProvider, messages: any[]): Promise<any> => {
  // Convert messages format for Anthropic
  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');
  
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: Math.min(provider.maxTokens, 4096),
      system: systemMessage?.content || '',
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Convert response to OpenAI format
  return {
    choices: [{
      message: {
        content: data.content[0].text,
        role: 'assistant'
      }
    }],
    usage: data.usage
  };
};

const callGeminiAPI = async (provider: AIProvider, messages: any[]): Promise<any> => {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
  
  const response = await fetch(`${provider.endpoint}?key=${provider.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: Math.min(provider.maxTokens, 4096),
        temperature: 0.7
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Convert response to OpenAI format
  return {
    choices: [{
      message: {
        content: data.candidates[0].content.parts[0].text,
        role: 'assistant'
      }
    }],
    usage: data.usageMetadata
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, temperature = 0.7, max_tokens = 4096 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    console.log('AI Rotation: Processing request with', messages.length, 'messages');

    const provider = getNextProvider();
    
    if (!provider) {
      throw new Error('All AI providers are rate limited or unavailable');
    }

    console.log(`Using provider: ${provider.id} (${provider.type}) - Model: ${provider.model}`);
    
    addRequest(provider.id);

    let result;
    
    switch (provider.type) {
      case 'groq':
        result = await callGroqAPI(provider, messages);
        break;
      case 'openai':
        result = await callOpenAIAPI(provider, messages);
        break;
      case 'anthropic':
        result = await callAnthropicAPI(provider, messages);
        break;
      case 'gemini':
        result = await callGeminiAPI(provider, messages);
        break;
      default:
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }

    console.log(`AI Rotation: Success with ${provider.id}`);

    return new Response(JSON.stringify({
      ...result,
      provider_used: {
        id: provider.id,
        type: provider.type,
        model: provider.model
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Rotation Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});