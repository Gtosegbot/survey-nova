import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, Search, Filter, MapPin, Clock, User, 
  MessageSquare, Play, Pause, Volume2, Eye, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SurveyResponse {
  id: string;
  survey_id: string;
  respondent_data: any;
  answers: any;
  demographics: any;
  ip_address: string;
  coordinates: string;
  completed_at: string;
  audio_url: string | null;
  device_info: any;
  is_valid: boolean;
  survey?: {
    title: string;
  };
}

interface Survey {
  id: string;
  title: string;
}

export default function AuditDashboard() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSurveys();
    loadResponses();
  }, [selectedSurvey, genderFilter, ageFilter, locationFilter]);

  const loadSurveys = async () => {
    const { data } = await supabase
      .from('surveys')
      .select('id, title')
      .order('created_at', { ascending: false });
    
    if (data) setSurveys(data);
  };

  const loadResponses = async () => {
    setLoading(true);
    let query = supabase
      .from('survey_responses')
      .select(`
        *,
        survey:surveys(title)
      `)
      .order('completed_at', { ascending: false })
      .limit(100);

    if (selectedSurvey !== 'all') {
      query = query.eq('survey_id', selectedSurvey);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading responses:', error);
      toast({
        title: "Erro ao carregar respostas",
        description: error.message,
        variant: "destructive"
      });
    } else {
      let filtered = data || [];
      
      // Apply client-side filters
      if (genderFilter !== 'all') {
        filtered = filtered.filter(r => {
          const demo = r.demographics as Record<string, any>;
          return demo?.gender?.toLowerCase() === genderFilter.toLowerCase();
        });
      }
      
      if (ageFilter !== 'all') {
        filtered = filtered.filter(r => {
          const demo = r.demographics as Record<string, any>;
          return demo?.age_range === ageFilter;
        });
      }
      
      if (locationFilter !== 'all') {
        filtered = filtered.filter(r => {
          const demo = r.demographics as Record<string, any>;
          return demo?.location?.toLowerCase().includes(locationFilter.toLowerCase());
        });
      }
      
      if (searchTerm) {
        filtered = filtered.filter(r => 
          JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setResponses(filtered as SurveyResponse[]);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Pesquisa', 'Nome', 'Gênero', 'Idade', 'Localização', 
      'IP', 'Coordenadas', 'Data/Hora', 'Válido', 'Áudio'
    ];
    
    const rows = responses.map(r => [
      r.id,
      r.survey?.title || r.survey_id,
      r.respondent_data?.name || '-',
      r.demographics?.gender || '-',
      r.demographics?.age_range || '-',
      r.demographics?.location || '-',
      r.ip_address || '-',
      r.coordinates || '-',
      r.completed_at ? format(new Date(r.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
      r.is_valid ? 'Sim' : 'Não',
      r.audio_url || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_respostas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: `${responses.length} registros exportados para CSV.`
    });
  };

  const toggleAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(audioUrl);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Auditoria</h1>
          <p className="text-muted-foreground">
            Visualize todas as respostas com IP, localização e gravações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadResponses}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Pesquisa</label>
              <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as pesquisas</SelectItem>
                  {surveys.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Gênero</label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Faixa Etária</label>
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="16-24">16-24 anos</SelectItem>
                  <SelectItem value="25-34">25-34 anos</SelectItem>
                  <SelectItem value="35-44">35-44 anos</SelectItem>
                  <SelectItem value="45-54">45-54 anos</SelectItem>
                  <SelectItem value="55+">55+ anos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Localização</label>
              <Input 
                placeholder="Buscar localização..." 
                value={locationFilter === 'all' ? '' : locationFilter}
                onChange={(e) => setLocationFilter(e.target.value || 'all')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Busca Geral</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{responses.length}</div>
            <p className="text-sm text-muted-foreground">Total de Respostas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {responses.filter(r => r.is_valid).length}
            </div>
            <p className="text-sm text-muted-foreground">Respostas Válidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {responses.filter(r => r.audio_url).length}
            </div>
            <p className="text-sm text-muted-foreground">Com Áudio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {responses.filter(r => r.coordinates).length}
            </div>
            <p className="text-sm text-muted-foreground">Com Localização</p>
          </CardContent>
        </Card>
      </div>

      {/* Responses Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Respondente</TableHead>
                  <TableHead>Pesquisa</TableHead>
                  <TableHead>Demografia</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Áudio</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : responses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Nenhuma resposta encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{response.respondent_data?.name || 'Anônimo'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="truncate max-w-[150px] block">
                          {response.survey?.title || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-xs w-fit">
                            {response.demographics?.gender || '-'}
                          </Badge>
                          <Badge variant="outline" className="text-xs w-fit">
                            {response.demographics?.age_range || '-'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {response.ip_address || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        {response.coordinates ? (
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[100px]">
                              {response.demographics?.location || response.coordinates}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {response.completed_at 
                            ? format(new Date(response.completed_at), 'dd/MM/yy HH:mm', { locale: ptBR })
                            : '-'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        {response.audio_url ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleAudio(response.audio_url!)}
                          >
                            {playingAudio === response.audio_url ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Resposta</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Dados do Respondente</h4>
                                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(response.respondent_data, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Respostas</h4>
                                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(response.answers, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Informações do Dispositivo</h4>
                                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(response.device_info, null, 2)}
                                </pre>
                              </div>
                              {response.audio_url && (
                                <div>
                                  <h4 className="font-semibold mb-2">Gravação de Áudio</h4>
                                  <audio controls className="w-full">
                                    <source src={response.audio_url} type="audio/webm" />
                                  </audio>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Audio Player */}
      {playingAudio && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <Volume2 className="h-5 w-5 text-primary" />
          <audio
            autoPlay
            src={playingAudio}
            onEnded={() => setPlayingAudio(null)}
            controls
          />
          <Button size="sm" variant="ghost" onClick={() => setPlayingAudio(null)}>
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
