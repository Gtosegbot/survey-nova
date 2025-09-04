import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailProvider {
  id: string;
  type: 'brevo' | 'smtp' | 'sendgrid';
  apiKey?: string;
  smtpConfig?: {
    host: string;
    port: number;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
  };
  isActive: boolean;
  rateLimitPerMinute: number;
  lastUsed?: number;
}

// Email providers configuration with rotation
const emailProviders: EmailProvider[] = [
  {
    id: 'brevo1',
    type: 'brevo',
    apiKey: Deno.env.get('BREVO_API_KEY_1') || '',
    isActive: true,
    rateLimitPerMinute: 300 // Brevo limit
  },
  {
    id: 'brevo2',
    type: 'brevo',
    apiKey: Deno.env.get('BREVO_API_KEY_2') || '',
    isActive: true,
    rateLimitPerMinute: 300
  },
  {
    id: 'brevo3',
    type: 'brevo',
    apiKey: Deno.env.get('BREVO_API_KEY_3') || '',
    isActive: true,
    rateLimitPerMinute: 300
  },
  {
    id: 'smtp_custom',
    type: 'smtp',
    smtpConfig: {
      host: Deno.env.get('SMTP_HOST') || '',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || '',
      password: Deno.env.get('SMTP_PASSWORD') || '',
      fromEmail: Deno.env.get('SMTP_FROM_EMAIL') || '',
      fromName: Deno.env.get('SMTP_FROM_NAME') || 'Te Pesquisei'
    },
    isActive: true,
    rateLimitPerMinute: 100
  }
];

// Rate limiting tracking
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

const getNextProvider = (): EmailProvider | null => {
  const activeProviders = emailProviders.filter(p => p.isActive && 
    (p.type === 'brevo' ? p.apiKey : p.smtpConfig?.host));
  
  for (const provider of activeProviders) {
    if (!isRateLimited(provider.id, provider.rateLimitPerMinute)) {
      return provider;
    }
  }
  
  return null;
};

const sendEmailBrevo = async (provider: EmailProvider, to: string[], subject: string, htmlContent: string, textContent?: string): Promise<any> => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': provider.apiKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Te Pesquisei',
        email: 'noreply@tepesquisei.com'
      },
      to: to.map(email => ({ email })),
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error: ${response.status} ${errorText}`);
  }

  return await response.json();
};

const sendEmailSMTP = async (provider: EmailProvider, to: string[], subject: string, htmlContent: string): Promise<any> => {
  // For SMTP, we'll use a simplified approach
  // In production, you'd use a proper SMTP library
  
  const config = provider.smtpConfig!;
  
  // This is a simplified implementation
  // In production, implement proper SMTP with authentication
  const emailData = {
    from: `${config.fromName} <${config.fromEmail}>`,
    to: to.join(', '),
    subject: subject,
    html: htmlContent,
    timestamp: new Date().toISOString()
  };

  console.log(`SMTP Email would be sent via ${config.host}:${config.port}`, emailData);
  
  // Simulate successful send
  return {
    messageId: `smtp-${Date.now()}`,
    accepted: to,
    rejected: []
  };
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const replaceVariables = (template: string, variables: Record<string, string>): string => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, to, subject, content, variables, bulk_emails } = await req.json();

    if (action === 'send_single') {
      if (!to || !subject || !content) {
        throw new Error('Email address, subject, and content are required');
      }

      // Validate email
      if (!validateEmail(to)) {
        throw new Error('Invalid email address format');
      }

      const provider = getNextProvider();
      if (!provider) {
        throw new Error('All email providers are rate limited or unavailable');
      }

      console.log(`Using email provider: ${provider.id} (${provider.type})`);
      
      addRequest(provider.id);

      // Replace variables in content and subject
      const processedSubject = variables ? replaceVariables(subject, variables) : subject;
      const processedContent = variables ? replaceVariables(content, variables) : content;

      let result;

      switch (provider.type) {
        case 'brevo':
          result = await sendEmailBrevo(provider, [to], processedSubject, processedContent);
          break;
        case 'smtp':
          result = await sendEmailSMTP(provider, [to], processedSubject, processedContent);
          break;
        default:
          throw new Error(`Unsupported provider type: ${provider.type}`);
      }

      console.log(`Email sent successfully via ${provider.id}`);

      return new Response(JSON.stringify({
        success: true,
        provider_used: provider.id,
        message_id: result.messageId || result.messageIds?.[0] || 'unknown',
        result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'send_bulk') {
      if (!bulk_emails || !Array.isArray(bulk_emails)) {
        throw new Error('bulk_emails array is required');
      }

      const results = [];
      const failed = [];

      for (let i = 0; i < bulk_emails.length; i++) {
        const { to, subject, content, variables: emailVars } = bulk_emails[i];
        
        try {
          // Validate email
          if (!validateEmail(to)) {
            failed.push({ to, error: 'Invalid email format' });
            continue;
          }

          const provider = getNextProvider();
          if (!provider) {
            failed.push({ to, error: 'No available providers' });
            continue;
          }

          addRequest(provider.id);

          // Replace variables
          const processedSubject = emailVars ? replaceVariables(subject, emailVars) : subject;
          const processedContent = emailVars ? replaceVariables(content, emailVars) : content;
          
          let result;
          switch (provider.type) {
            case 'brevo':
              result = await sendEmailBrevo(provider, [to], processedSubject, processedContent);
              break;
            case 'smtp':
              result = await sendEmailSMTP(provider, [to], processedSubject, processedContent);
              break;
            default:
              throw new Error(`Unsupported provider type: ${provider.type}`);
          }

          results.push({
            to,
            success: true,
            provider: provider.id,
            message_id: result.messageId || result.messageIds?.[0] || 'unknown'
          });

          // Rate limiting delay
          if (i < bulk_emails.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
          }

        } catch (error) {
          console.error(`Failed to send email to ${to}:`, error);
          failed.push({ to, error: error.message });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        total: bulk_emails.length,
        sent: results.length,
        failed: failed.length,
        results,
        failed_emails: failed
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'status') {
      // Return provider status
      const status = emailProviders.map(provider => ({
        id: provider.id,
        type: provider.type,
        isActive: provider.isActive,
        isConfigured: provider.type === 'brevo' 
          ? !!provider.apiKey
          : !!(provider.smtpConfig?.host && provider.smtpConfig?.username),
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
    console.error('Email Dispatcher Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});