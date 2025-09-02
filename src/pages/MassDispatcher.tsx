import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Phone,
  Users,
  Settings,
  Play,
  Pause,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  group?: string;
}

interface Survey {
  id: string;
  title: string;
  description: string;
}

interface Campaign {
  id: string;
  name: string;
  surveyId: string;
  surveyTitle: string;
  type: 'email' | 'sms' | 'whatsapp';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  contacts: Contact[];
  message: string;
  scheduledDate?: Date;
  sentCount: number;
  deliveredCount: number;
  responseCount: number;
  createdAt: Date;
}

export default function MassDispatcher() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState<{
    name: string;
    surveyId: string;
    type: 'email' | 'sms' | 'whatsapp';
    message: string;
    scheduledDate: string;
  }>({
    name: "",
    surveyId: "",
    type: 'email',
    message: "",
    scheduledDate: ""
  });

  useEffect(() => {
    // Carregar dados do localStorage
    const savedContacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const savedSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    const savedCampaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    
    setContacts(savedContacts);
    setSurveys(savedSurveys);
    setCampaigns(savedCampaigns);
  }, []);

  const handleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    setSelectedContacts(contacts.map(c => c.id));
  };

  const clearSelection = () => {
    setSelectedContacts([]);
  };

  const getDefaultMessage = (type: string, surveyTitle: string) => {
    const baseUrl = `${window.location.origin}/survey/`;
    
    switch (type) {
      case 'email':
        return `Olá {nome}!\n\nVocê foi convidado(a) para participar da pesquisa "${surveyTitle}".\n\nSua opinião é muito importante para nós. Clique no link abaixo para participar:\n{link}\n\nObrigado!`;
      case 'sms':
        return `Olá {nome}! Participe da nossa pesquisa "${surveyTitle}": {link}`;
      case 'whatsapp':
        return `Olá {nome}! 👋\n\nConvidamos você para participar da pesquisa *${surveyTitle}*.\n\nSua opinião é muito valiosa! 🙏\n\nClique aqui para participar: {link}\n\nObrigado! 😊`;
      default:
        return "";
    }
  };

  const calculateCost = () => {
    const costs = { email: 0.10, sms: 0.15, whatsapp: 2.00 };
    return selectedContacts.length * costs[newCampaign.type];
  };

  const createCampaign = () => {
    if (!newCampaign.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da campanha é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!newCampaign.surveyId) {
      toast({
        title: "Erro", 
        description: "Selecione uma pesquisa.",
        variant: "destructive"
      });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um contato.",
        variant: "destructive"
      });
      return;
    }

    const selectedSurvey = surveys.find(s => s.id === newCampaign.surveyId);
    const campaignContacts = contacts.filter(c => selectedContacts.includes(c.id));

    const campaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaign.name,
      surveyId: newCampaign.surveyId,
      surveyTitle: selectedSurvey?.title || "",
      type: newCampaign.type,
      status: newCampaign.scheduledDate ? 'scheduled' : 'draft',
      contacts: campaignContacts,
      message: newCampaign.message || getDefaultMessage(newCampaign.type, selectedSurvey?.title || ""),
      scheduledDate: newCampaign.scheduledDate ? new Date(newCampaign.scheduledDate) : undefined,
      sentCount: 0,
      deliveredCount: 0,
      responseCount: 0,
      createdAt: new Date()
    };

    const updatedCampaigns = [...campaigns, campaign];
    setCampaigns(updatedCampaigns);
    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));

    // Reset form
    setNewCampaign({
      name: "",
      surveyId: "",
      type: 'email',
      message: "",
      scheduledDate: ""
    });
    setSelectedContacts([]);

    toast({
      title: "Campanha criada!",
      description: `Campanha "${campaign.name}" criada com sucesso.`,
    });
  };

  const startCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.map(c => 
      c.id === campaignId ? { ...c, status: 'sending' as const } : c
    );
    setCampaigns(updatedCampaigns);
    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));

    toast({
      title: "Campanha iniciada!",
      description: "Os disparos começarão em instantes.",
    });

    // Simular envio
    setTimeout(() => {
      const campaign = updatedCampaigns.find(c => c.id === campaignId);
      if (campaign) {
        campaign.status = 'completed';
        campaign.sentCount = campaign.contacts.length;
        campaign.deliveredCount = Math.floor(campaign.contacts.length * 0.95);
        localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
        setCampaigns([...updatedCampaigns]);
      }
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <AlertCircle className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'sending': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'scheduled': return 'bg-blue-500';
      case 'sending': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Disparador em Massa</h1>
        <p className="text-muted-foreground">Envie pesquisas para múltiplos contatos</p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Criar Campanha</TabsTrigger>
          <TabsTrigger value="campaigns">Minhas Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {/* Campaign Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Nova Campanha</CardTitle>
              <CardDescription>Configure os detalhes da sua campanha de disparo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign-name">Nome da Campanha</Label>
                  <Input
                    id="campaign-name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Pesquisa Satisfação Cliente - Janeiro"
                  />
                </div>
                <div>
                  <Label htmlFor="survey-select">Pesquisa</Label>
                  <Select
                    value={newCampaign.surveyId}
                    onValueChange={(value) => setNewCampaign(prev => ({ ...prev, surveyId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pesquisa" />
                    </SelectTrigger>
                    <SelectContent>
                      {surveys.map((survey) => (
                        <SelectItem key={survey.id} value={survey.id}>
                          {survey.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="channel-type">Canal de Envio</Label>
                  <Select
                    value={newCampaign.type}
                    onValueChange={(value: 'email' | 'sms' | 'whatsapp') => {
                      setNewCampaign(prev => ({ 
                        ...prev, 
                        type: value,
                        message: ""
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          E-mail (R$ 0,10 cada)
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          SMS (R$ 0,15 cada)
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          WhatsApp (R$ 2,00 cada)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduled-date">Agendar Envio (Opcional)</Label>
                  <Input
                    id="scheduled-date"
                    type="datetime-local"
                    value={newCampaign.scheduledDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={newCampaign.message || (newCampaign.surveyId ? getDefaultMessage(newCampaign.type, surveys.find(s => s.id === newCampaign.surveyId)?.title || "") : "")}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Digite a mensagem personalizada..."
                  rows={6}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use {'{nome}'} para personalizar com o nome do contato e {'{link}'} para o link da pesquisa.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Selection */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Selecionar Contatos</CardTitle>
                  <CardDescription>
                    {selectedContacts.length} de {contacts.length} contatos selecionados
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllContacts}>
                    Selecionar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Limpar Seleção
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum contato importado.</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/contacts/import'}>
                    Importar Contatos
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={() => handleContactSelection(contact.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {contact.email && `${contact.email} • `}
                          {contact.phone && `${contact.phone} • `}
                          {contact.group && (
                            <Badge variant="secondary" className="text-xs">
                              {contact.group}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Summary */}
          {selectedContacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Campanha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedContacts.length}</div>
                    <div className="text-sm text-muted-foreground">Contatos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">R$ {calculateCost().toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Custo Total</div>
                  </div>
                  <div className="text-center">
                    <Button onClick={createCampaign} className="w-full">
                      <Send className="mr-2 h-4 w-4" />
                      Criar Campanha
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Campaigns List */}
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma campanha criada ainda.</p>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {getStatusIcon(campaign.status)}
                          {campaign.name}
                        </CardTitle>
                        <CardDescription>
                          Pesquisa: {campaign.surveyTitle} • Canal: {campaign.type}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status === 'draft' ? 'Rascunho' : 
                           campaign.status === 'scheduled' ? 'Agendada' :
                           campaign.status === 'sending' ? 'Enviando' : 'Concluída'}
                        </Badge>
                        {campaign.status === 'draft' && (
                          <Button size="sm" onClick={() => startCampaign(campaign.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Iniciar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{campaign.contacts.length}</div>
                        <div className="text-sm text-muted-foreground">Contatos</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{campaign.sentCount}</div>
                        <div className="text-sm text-muted-foreground">Enviados</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{campaign.deliveredCount}</div>
                        <div className="text-sm text-muted-foreground">Entregues</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{campaign.responseCount}</div>
                        <div className="text-sm text-muted-foreground">Responderam</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}