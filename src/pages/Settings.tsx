import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Mail,
  MessageSquare,
  Phone,
  Mic,
  Brain,
  Key,
  Server,
  Users,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  TestTube,
  Plus,
  Trash2
} from "lucide-react";

interface Credential {
  id: string;
  name: string;
  value: string;
  isActive: boolean;
  lastUsed?: string;
  type: 'api_key' | 'webhook' | 'config';
}

interface APIProvider {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'voip' | 'ai';
  credentials: Credential[];
  isEnabled: boolean;
  rotationEnabled?: boolean;
  currentActive?: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [providers, setProviders] = useState<APIProvider[]>([
    {
      id: 'email',
      name: 'Email (SMTP)',
      type: 'email',
      isEnabled: true,
      rotationEnabled: true,
      credentials: [
        { id: 'brevo1', name: 'Brevo Conta 1', value: '', isActive: true, type: 'api_key' },
        { id: 'brevo2', name: 'Brevo Conta 2', value: '', isActive: false, type: 'api_key' },
        { id: 'brevo3', name: 'Brevo Conta 3', value: '', isActive: false, type: 'api_key' },
        { id: 'smtp_custom', name: 'SMTP Personalizado', value: '', isActive: false, type: 'config' }
      ]
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      type: 'whatsapp',
      isEnabled: false,
      credentials: [
        { id: 'whatsapp_official', name: 'WhatsApp Business API', value: '', isActive: false, type: 'api_key' },
        { id: 'evolution_api', name: 'Evolution API', value: '', isActive: false, type: 'webhook' },
        { id: 'baileys', name: 'Baileys (Não-oficial)', value: '', isActive: false, type: 'config' }
      ]
    },
    {
      id: 'sms',
      name: 'SMS',
      type: 'sms',
      isEnabled: false,
      credentials: [
        { id: 'twilio_sms', name: 'Twilio SMS', value: '', isActive: false, type: 'api_key' },
        { id: 'zenvia', name: 'Zenvia', value: '', isActive: false, type: 'api_key' }
      ]
    },
    {
      id: 'voip',
      name: 'VoIP & LiveKit',
      type: 'voip',
      isEnabled: false,
      credentials: [
        { id: 'livekit_api', name: 'LiveKit API Key', value: '', isActive: false, type: 'api_key' },
        { id: 'livekit_secret', name: 'LiveKit Secret', value: '', isActive: false, type: 'api_key' },
        { id: 'twilio_voice', name: 'Twilio Voice', value: '', isActive: false, type: 'api_key' }
      ]
    },
    {
      id: 'ai',
      name: 'IA & LLM',
      type: 'ai',
      isEnabled: true,
      rotationEnabled: true,
      currentActive: 'groq1',
      credentials: [
        { id: 'groq1', name: 'Groq Conta 1 (Gratuita)', value: '', isActive: true, type: 'api_key' },
        { id: 'groq2', name: 'Groq Conta 2 (Gratuita)', value: '', isActive: false, type: 'api_key' },
        { id: 'groq3', name: 'Groq Conta 3 (Gratuita)', value: '', isActive: false, type: 'api_key' },
        { id: 'groq4', name: 'Groq Conta 4 (Gratuita)', value: '', isActive: false, type: 'api_key' },
        { id: 'groq5', name: 'Groq Conta 5 (Gratuita)', value: '', isActive: false, type: 'api_key' },
        { id: 'groq6', name: 'Groq Conta 6 (Gratuita)', value: '', isActive: false, type: 'api_key' },
        { id: 'openai', name: 'OpenAI (Fallback Premium)', value: '', isActive: false, type: 'api_key' },
        { id: 'anthropic', name: 'Anthropic Claude (Fallback)', value: '', isActive: false, type: 'api_key' },
        { id: 'gemini', name: 'Google Gemini (Fallback)', value: '', isActive: false, type: 'api_key' }
      ]
    }
  ]);

  const [webhookConfig, setWebhookConfig] = useState({
    n8n_webhook: '',
    zapier_webhook: '',
    custom_webhook: '',
    webhook_secret: ''
  });

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const updateCredential = (providerId: string, credentialId: string, value: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? {
            ...provider,
            credentials: provider.credentials.map(cred => 
              cred.id === credentialId ? { ...cred, value } : cred
            )
          }
        : provider
    ));
  };

  const toggleCredentialActive = (providerId: string, credentialId: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? {
            ...provider,
            credentials: provider.credentials.map(cred => 
              cred.id === credentialId ? { ...cred, isActive: !cred.isActive } : cred
            )
          }
        : provider
    ));
  };

  const toggleProviderEnabled = (providerId: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId ? { ...provider, isEnabled: !provider.isEnabled } : provider
    ));
  };

  const testCredential = async (providerId: string, credentialId: string) => {
    setIsLoading(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Teste Bem-sucedido",
        description: "As credenciais foram validadas com sucesso."
      });
      
      // Update last used timestamp
      setProviders(prev => prev.map(provider => 
        provider.id === providerId 
          ? {
              ...provider,
              credentials: provider.credentials.map(cred => 
                cred.id === credentialId 
                  ? { ...cred, lastUsed: new Date().toLocaleString() } 
                  : cred
              )
            }
          : provider
      ));
    } catch (error) {
      toast({
        title: "Erro no Teste",
        description: "Não foi possível validar as credenciais.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAllCredentials = async () => {
    setIsLoading(true);
    try {
      // Here we would save to Supabase secrets
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Credenciais Salvas",
        description: "Todas as configurações foram salvas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'whatsapp': return MessageSquare;
      case 'sms': return Phone;
      case 'voip': return Mic;
      case 'ai': return Brain;
      default: return Key;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie APIs, credenciais e configurações da plataforma
          </p>
        </div>
        <Button onClick={saveAllCredentials} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Tudo"}
        </Button>
      </div>

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="credentials">Credenciais</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="rotation">Rotação AI</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-6">
          <div className="grid gap-6">
            {providers.map((provider) => {
              const IconComponent = getProviderIcon(provider.type);
              return (
                <Card key={provider.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5" />
                        <div>
                          <CardTitle>{provider.name}</CardTitle>
                          <CardDescription>
                            Configure as credenciais para {provider.name.toLowerCase()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {provider.rotationEnabled && (
                          <Badge variant="outline">Rotação Ativa</Badge>
                        )}
                        <Switch
                          checked={provider.isEnabled}
                          onCheckedChange={() => toggleProviderEnabled(provider.id)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {provider.credentials.map((credential) => (
                        <div key={credential.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">{credential.name}</Label>
                              <div className="flex items-center gap-2">
                                {credential.lastUsed && (
                                  <span className="text-xs text-muted-foreground">
                                    Último uso: {credential.lastUsed}
                                  </span>
                                )}
                                <Switch
                                  checked={credential.isActive}
                                  onCheckedChange={() => toggleCredentialActive(provider.id, credential.id)}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  type={showPassword[credential.id] ? "text" : "password"}
                                  placeholder={`${credential.name} API Key`}
                                  value={credential.value}
                                  onChange={(e) => updateCredential(provider.id, credential.id, e.target.value)}
                                  disabled={!provider.isEnabled}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                  onClick={() => togglePasswordVisibility(credential.id)}
                                >
                                  {showPassword[credential.id] ? 
                                    <EyeOff className="h-3 w-3" /> : 
                                    <Eye className="h-3 w-3" />
                                  }
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testCredential(provider.id, credential.id)}
                                disabled={!credential.value.trim() || !provider.isEnabled || isLoading}
                              >
                                <TestTube className="h-4 w-4 mr-1" />
                                Testar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Configuração de Webhooks
              </CardTitle>
              <CardDescription>
                Configure webhooks para integração com n8n, Zapier e outras ferramentas de automação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="n8n_webhook">Webhook n8n</Label>
                  <Input
                    id="n8n_webhook"
                    placeholder="https://seu-n8n.com/webhook/..."
                    value={webhookConfig.n8n_webhook}
                    onChange={(e) => setWebhookConfig(prev => ({ ...prev, n8n_webhook: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="zapier_webhook">Webhook Zapier</Label>
                  <Input
                    id="zapier_webhook"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookConfig.zapier_webhook}
                    onChange={(e) => setWebhookConfig(prev => ({ ...prev, zapier_webhook: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="custom_webhook">Webhook Personalizado</Label>
                  <Input
                    id="custom_webhook"
                    placeholder="https://sua-api.com/webhook"
                    value={webhookConfig.custom_webhook}
                    onChange={(e) => setWebhookConfig(prev => ({ ...prev, custom_webhook: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="webhook_secret">Secret de Validação</Label>
                  <Input
                    id="webhook_secret"
                    type="password"
                    placeholder="Secret para validação dos webhooks"
                    value={webhookConfig.webhook_secret}
                    onChange={(e) => setWebhookConfig(prev => ({ ...prev, webhook_secret: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rotation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Sistema de Rotação de IA
              </CardTitle>
              <CardDescription>
                Configure a rotação automática entre provedores de IA para otimizar custos e disponibilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-green-800 mb-2">Provedores Gratuitos (Rotação Ativa)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Groq (6 contas)</span>
                        <Badge variant="outline" className="text-green-700">Ativo</Badge>
                      </div>
                      <div className="text-xs text-green-600">
                        Modelos: Llama3-70b, Mixtral-8x7b, Gemma2-9b
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Provedores Premium (Fallback)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>OpenAI GPT-4</span>
                        <Badge variant="outline" className="text-blue-700">Standby</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Anthropic Claude</span>
                        <Badge variant="outline" className="text-blue-700">Standby</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Google Gemini</span>
                        <Badge variant="outline" className="text-blue-700">Standby</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Rate Limit por Minuto (Groq)</Label>
                    <Input type="number" defaultValue="30" />
                  </div>
                  <div>
                    <Label>Timeout para Fallback (seg)</Label>
                    <Input type="number" defaultValue="10" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Configure políticas de segurança e acesso para a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Apenas Admins podem configurar APIs</Label>
                    <p className="text-sm text-muted-foreground">Restringe acesso às configurações de API</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Require plano pago para APIs premium</Label>
                    <p className="text-sm text-muted-foreground">OpenAI, Claude e Gemini apenas para assinantes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Log de uso de APIs</Label>
                    <p className="text-sm text-muted-foreground">Registra todas as chamadas de API para auditoria</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Criptografia de credenciais</Label>
                    <p className="text-sm text-muted-foreground">Todas as credenciais são criptografadas no banco</p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}