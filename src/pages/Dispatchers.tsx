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
import { supabase } from "@/integrations/supabase/client";
import {
  Send,
  Mail,
  MessageSquare,
  Phone,
  Globe,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  recipients: number;
  sent: number;
  opened: number;
  responded: number;
  scheduledFor?: Date;
  createdAt: Date;
}

interface Template {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
}

export default function Dispatchers() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState("");
  const [selectedContacts, setSelectedContacts] = useState("");

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Pesquisa Satisfação Q1',
      type: 'whatsapp',
      status: 'completed',
      recipients: 500,
      sent: 500,
      opened: 432,
      responded: 387,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Intenção de Voto Municipal',
      type: 'sms',
      status: 'sending',
      recipients: 1200,
      sent: 856,
      opened: 734,
      responded: 245,
      scheduledFor: new Date(),
      createdAt: new Date('2024-01-20')
    },
    {
      id: '3',
      name: 'Avaliação Produto Beta',
      type: 'email',
      status: 'scheduled',
      recipients: 300,
      sent: 0,
      opened: 0,
      responded: 0,
      scheduledFor: new Date('2024-01-25T14:00:00'),
      createdAt: new Date('2024-01-22')
    }
  ]);

  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Convite Padrão WhatsApp',
      type: 'whatsapp',
      content: 'Olá {{nome}}! Você foi selecionado para participar da nossa pesquisa "{{pesquisa}}". Sua opinião é muito importante! Clique aqui: {{link}}',
      variables: ['nome', 'pesquisa', 'link']
    },
    {
      id: '2',
      name: 'Email Profissional',
      type: 'email',
      subject: 'Sua opinião importa - {{pesquisa}}',
      content: 'Prezado(a) {{nome}},\n\nGostaríamos de convidá-lo para participar da nossa pesquisa sobre {{pesquisa}}.\n\nSua participação é voluntária e anônima, levando aproximadamente {{tempo}} minutos.\n\nAccesse: {{link}}\n\nAtenciosamente,\nEquipe {{empresa}}',
      variables: ['nome', 'pesquisa', 'tempo', 'link', 'empresa']
    },
    {
      id: '3',
      name: 'SMS Simples',
      type: 'sms',
      content: '{{nome}}, participe da pesquisa {{pesquisa}}. Leva só {{tempo}}min: {{link}}',
      variables: ['nome', 'pesquisa', 'tempo', 'link']
    }
  ]);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'whatsapp' as 'email' | 'whatsapp' | 'sms',
    selectedTemplate: '',
    customMessage: '',
    scheduleDate: '',
    scheduleTime: '',
    useRotation: true,
    rateLimitPerMinute: 30
  });

  const startCampaign = async (campaignId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: 'sending' as const }
          : campaign
      ));
      
      toast({
        title: "Campanha Iniciada",
        description: "O disparo foi iniciado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a campanha.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: 'paused' as const }
        : campaign
    ));
    
    toast({
      title: "Campanha Pausada",
      description: "O disparo foi pausado com sucesso."
    });
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !selectedSurvey || !selectedContacts) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Criar campanha no banco via Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: newCampaign.name,
          type: newCampaign.type,
          status: newCampaign.scheduleDate ? 'scheduled' : 'draft',
          scheduled_for: newCampaign.scheduleDate 
            ? new Date(`${newCampaign.scheduleDate}T${newCampaign.scheduleTime}`).toISOString() 
            : null,
          survey_id: selectedSurvey,
          content: {
            template: newCampaign.selectedTemplate,
            customMessage: newCampaign.customMessage
          }
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Se não for agendada, iniciar disparo imediatamente via n8n
      if (!newCampaign.scheduleDate) {
        const { data: surveyData } = await supabase
          .from('surveys')
          .select('id, title')
          .eq('id', selectedSurvey)
          .single();

        const { data: contactsData } = await supabase
          .from('contacts')
          .select('name, email, phone')
          .eq('user_id', user.id)
          .limit(100);

        if (contactsData && contactsData.length > 0) {
          const recipients = contactsData.map(c => ({
            name: c.name,
            contact: newCampaign.type === 'email' ? c.email : c.phone
          })).filter(r => r.contact);

          // Chamar edge function n8n-dispatcher
          const { error: dispatchError } = await supabase.functions.invoke('n8n-dispatcher', {
            body: {
              channel: newCampaign.type,
              recipients,
              message: {
                subject: `Participe: ${surveyData?.title}`,
                content: newCampaign.customMessage || `Você foi convidado para participar da pesquisa "${surveyData?.title}". Sua opinião é muito importante!`,
                surveyLink: `${window.location.origin}/research/${selectedSurvey}`
              },
              campaignId: campaign.id,
              userId: user.id
            }
          });

          if (dispatchError) {
            console.error('Erro no disparo:', dispatchError);
            toast({
              title: "Aviso",
              description: "Campanha criada mas houve erro no disparo. Verifique seus créditos.",
              variant: "destructive"
            });
          }
        }
      }

      const newCampaignUI: Campaign = {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type as 'email' | 'whatsapp' | 'sms',
        status: campaign.status as Campaign['status'],
        recipients: 150,
        sent: campaign.sent_count || 0,
        opened: 0,
        responded: campaign.response_count || 0,
        scheduledFor: campaign.scheduled_for ? new Date(campaign.scheduled_for) : undefined,
        createdAt: new Date(campaign.created_at)
      };
      
      setCampaigns(prev => [newCampaignUI, ...prev]);
      
      setNewCampaign({
        name: '',
        type: 'whatsapp',
        selectedTemplate: '',
        customMessage: '',
        scheduleDate: '',
        scheduleTime: '',
        useRotation: true,
        rateLimitPerMinute: 30
      });
      
      toast({
        title: "Campanha Criada",
        description: `Campanha "${campaign.name}" criada e ${newCampaignUI.scheduledFor ? 'agendada' : 'disparada'} com sucesso!`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Erro ao criar campanha:', errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sending': return <Play className="h-4 w-4 text-blue-600" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      default: return <Send className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-orange-100 text-orange-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Send className="h-8 w-8 text-primary" />
            Disparadores de Pesquisa
          </h1>
          <p className="text-muted-foreground">
            Gerencie campanhas de disparo via WhatsApp, Email e SMS
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">Rotação Ativa</Badge>
          <Badge variant="outline">APIs Configuradas</Badge>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="create">Criar Campanha</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(campaign.type)}
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1 capitalize">{campaign.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>Destinatários: {campaign.recipients}</span>
                        <span>Enviados: {campaign.sent}</span>
                        <span>Abertos: {campaign.opened}</span>
                        <span>Responderam: {campaign.responded}</span>
                        {campaign.scheduledFor && (
                          <span>Agendado: {campaign.scheduledFor.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {campaign.status === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={() => startCampaign(campaign.id)}
                          disabled={isLoading}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar
                        </Button>
                      )}
                      {campaign.status === 'sending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => pauseCampaign(campaign.id)}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </Button>
                      )}
                      {campaign.status === 'paused' && (
                        <Button 
                          size="sm" 
                          onClick={() => startCampaign(campaign.id)}
                          disabled={isLoading}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Retomar
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Relatório
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progresso</span>
                      <span>{Math.round((campaign.sent / campaign.recipients) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(campaign.sent / campaign.recipients) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Campanha</CardTitle>
              <CardDescription>
                Configure uma nova campanha de disparo de pesquisas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign-name">Nome da Campanha</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Ex: Pesquisa Satisfação Janeiro"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-type">Canal de Disparo</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'email' | 'whatsapp' | 'sms' 
                    }))}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="survey-select">Pesquisa</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={selectedSurvey}
                    onChange={(e) => setSelectedSurvey(e.target.value)}
                  >
                    <option value="">Selecione uma pesquisa</option>
                    <option value="satisfaction-q1">Pesquisa Satisfação Q1</option>
                    <option value="product-feedback">Feedback Produto Beta</option>
                    <option value="market-research">Pesquisa de Mercado</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="contacts-select">Lista de Contatos</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={selectedContacts}
                    onChange={(e) => setSelectedContacts(e.target.value)}
                  >
                    <option value="">Selecione os contatos</option>
                    <option value="all-contacts">Todos os Contatos (1,247)</option>
                    <option value="segmented-a">Segmento A - SP Capital (456)</option>
                    <option value="segmented-b">Segmento B - Interior (789)</option>
                    <option value="vip-customers">Clientes VIP (98)</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="template-select">Template de Mensagem</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={newCampaign.selectedTemplate}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, selectedTemplate: e.target.value }))}
                >
                  <option value="">Selecione um template</option>
                  {templates
                    .filter(t => t.type === newCampaign.type)
                    .map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label htmlFor="custom-message">Mensagem Personalizada (opcional)</Label>
                <Textarea
                  id="custom-message"
                  placeholder="Adicione uma mensagem personalizada ou modificações ao template..."
                  value={newCampaign.customMessage}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, customMessage: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule-date">Agendar para (opcional)</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={newCampaign.scheduleDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduleDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="schedule-time">Horário</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={newCampaign.scheduleTime}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduleTime: e.target.value }))}
                    disabled={!newCampaign.scheduleDate}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Usar Rotação de APIs</Label>
                  <p className="text-sm text-muted-foreground">
                    Rotaciona automaticamente entre as APIs configuradas
                  </p>
                </div>
                <Switch
                  checked={newCampaign.useRotation}
                  onCheckedChange={(checked) => setNewCampaign(prev => ({ ...prev, useRotation: checked }))}
                />
              </div>

              <div>
                <Label htmlFor="rate-limit">Limite por Minuto</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  min="1"
                  max="100"
                  value={newCampaign.rateLimitPerMinute}
                  onChange={(e) => setNewCampaign(prev => ({ 
                    ...prev, 
                    rateLimitPerMinute: parseInt(e.target.value) 
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número máximo de envios por minuto (recomendado: 30 para WhatsApp, 60 para Email, 10 para SMS)
                </p>
              </div>

              <Button 
                onClick={createCampaign} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Criando..." : "Criar Campanha"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(template.type)}
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>
                          Template para {template.type} • Variáveis: {template.variables.join(', ')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Duplicar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.subject && (
                    <div className="mb-3">
                      <Label className="text-sm font-medium">Assunto:</Label>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Conteúdo:</Label>
                    <div className="mt-1 p-3 bg-muted rounded text-sm whitespace-pre-wrap">
                      {template.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}