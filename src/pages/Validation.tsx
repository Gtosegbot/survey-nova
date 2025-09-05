import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  X,
  MapPin,
  Mic,
  Users,
  Clock,
  Search,
  Ban
} from "lucide-react";

interface ValidationEntry {
  id: string;
  surveyId: string;
  surveyTitle: string;
  participantId: string;
  timestamp: string;
  validationType: 'location' | 'voice' | 'ip' | 'device';
  status: 'approved' | 'rejected' | 'pending';
  reason: string;
  details: {
    location?: { lat: number; lng: number; address: string };
    voicePattern?: string;
    ipAddress?: string;
    deviceFingerprint?: string;
    similarityScore?: number;
  };
  demographics: {
    age: string;
    gender: string;
    location: string;
  };
}

const mockValidations: ValidationEntry[] = [
  {
    id: '1',
    surveyId: 'survey_1',
    surveyTitle: 'Pesquisa de Satisfação - Cliente X',
    participantId: 'part_001',
    timestamp: '2024-01-15 14:30:00',
    validationType: 'voice',
    status: 'rejected',
    reason: 'Padrão de voz idêntico detectado',
    details: {
      voicePattern: 'voice_pattern_abc123',
      similarityScore: 98.5
    },
    demographics: {
      age: '25-34',
      gender: 'Masculino',
      location: 'São Paulo, SP'
    }
  },
  {
    id: '2',
    surveyId: 'survey_1',
    surveyTitle: 'Pesquisa de Satisfação - Cliente X',
    participantId: 'part_002',
    timestamp: '2024-01-15 14:25:00',
    validationType: 'location',
    status: 'pending',
    reason: 'Mesma coordenada - 4ª tentativa',
    details: {
      location: { lat: -23.5505, lng: -46.6333, address: 'Av. Paulista, 1000 - São Paulo, SP' }
    },
    demographics: {
      age: '35-44',
      gender: 'Feminino',
      location: 'São Paulo, SP'
    }
  },
  {
    id: '3',
    surveyId: 'survey_2',
    surveyTitle: 'Intenção de Voto - Eleições 2024',
    participantId: 'part_003',
    timestamp: '2024-01-15 13:45:00',
    validationType: 'voice',
    status: 'approved',
    reason: 'Padrão de voz único confirmado',
    details: {
      voicePattern: 'voice_pattern_xyz789',
      similarityScore: 12.3
    },
    demographics: {
      age: '45-59',
      gender: 'Masculino',
      location: 'Rio de Janeiro, RJ'
    }
  },
  {
    id: '4',
    surveyId: 'survey_1',
    surveyTitle: 'Pesquisa de Satisfação - Cliente X',
    participantId: 'part_004',
    timestamp: '2024-01-15 13:20:00',
    validationType: 'location',
    status: 'approved',
    reason: 'Nova localização válida',
    details: {
      location: { lat: -23.5515, lng: -46.6335, address: 'Rua Augusta, 500 - São Paulo, SP' }
    },
    demographics: {
      age: '18-24',
      gender: 'Feminino',
      location: 'São Paulo, SP'
    }
  }
];

export default function Validation() {
  const [validations, setValidations] = useState<ValidationEntry[]>(mockValidations);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterType, setFilterType] = useState<'all' | 'location' | 'voice' | 'ip' | 'device'>('all');

  const filteredValidations = validations.filter(validation => {
    const matchesSearch = validation.surveyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         validation.participantId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || validation.status === filterStatus;
    const matchesType = filterType === 'all' || validation.validationType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApprove = (id: string) => {
    setValidations(prev => prev.map(v => 
      v.id === id ? { ...v, status: 'approved' as const } : v
    ));
  };

  const handleReject = (id: string) => {
    setValidations(prev => prev.map(v => 
      v.id === id ? { ...v, status: 'rejected' as const } : v
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'location':
        return <MapPin className="h-4 w-4 text-blue-600" />;
      case 'voice':
        return <Mic className="h-4 w-4 text-purple-600" />;
      case 'ip':
        return <Shield className="h-4 w-4 text-orange-600" />;
      case 'device':
        return <Users className="h-4 w-4 text-green-600" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const statusCounts = {
    pending: validations.filter(v => v.status === 'pending').length,
    approved: validations.filter(v => v.status === 'approved').length,
    rejected: validations.filter(v => v.status === 'rejected').length
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Validação de Respostas</h1>
        <p className="text-muted-foreground">
          Sistema de validação anti-duplicação e controle de qualidade
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando revisão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
            <p className="text-xs text-muted-foreground">Validações aprovadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            <p className="text-xs text-muted-foreground">Duplicatas bloqueadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((statusCounts.approved / (statusCounts.approved + statusCounts.rejected)) * 100) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Respostas válidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por pesquisa ou participante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Todos
              </Button>
              <Button 
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                Pendentes
              </Button>
              <Button 
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('approved')}
              >
                Aprovadas
              </Button>
              <Button 
                variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('rejected')}
              >
                Rejeitadas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Validações */}
      <Card>
        <CardHeader>
          <CardTitle>Validações Recentes</CardTitle>
          <CardDescription>
            Histórico de validações automáticas e manuais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredValidations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma validação encontrada</p>
              </div>
            ) : (
              filteredValidations.map((validation) => (
                <div key={validation.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(validation.status)}
                      {getTypeIcon(validation.validationType)}
                      <div>
                        <h4 className="font-medium">{validation.surveyTitle}</h4>
                        <p className="text-sm text-muted-foreground">
                          Participante: {validation.participantId} • {new Date(validation.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          validation.status === 'approved' ? 'default' :
                          validation.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                      >
                        {validation.status === 'approved' ? 'Aprovada' :
                         validation.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                      </Badge>
                      
                      {validation.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleApprove(validation.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReject(validation.id)}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Detalhes da Validação</h5>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {validation.validationType === 'location' ? 'Localização' :
                             validation.validationType === 'voice' ? 'Voz' :
                             validation.validationType === 'ip' ? 'IP' : 'Dispositivo'}
                          </Badge>
                          <span>{validation.reason}</span>
                        </div>
                        
                        {validation.details.similarityScore && (
                          <div>Similaridade: {validation.details.similarityScore.toFixed(1)}%</div>
                        )}
                        
                        {validation.details.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {validation.details.location.address}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Demografia</h5>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Idade: {validation.demographics.age}</div>
                        <div>Gênero: {validation.demographics.gender}</div>
                        <div>Local: {validation.demographics.location}</div>
                      </div>
                    </div>
                  </div>

                  {validation.status === 'rejected' && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Resposta bloqueada:</span>
                        <span>{validation.reason}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}