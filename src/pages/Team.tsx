import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Settings,
  Crown,
  Shield,
  User,
  Mail,
  Phone,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'manager' | 'analyst' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  lastActive: string;
  permissions: {
    surveys: boolean;
    analytics: boolean;
    dispatchers: boolean;
    credits: boolean;
    team: boolean;
  };
}

const rolePermissions = {
  owner: {
    surveys: true,
    analytics: true,
    dispatchers: true,
    credits: true,
    team: true
  },
  admin: {
    surveys: true,
    analytics: true,
    dispatchers: true,
    credits: true,
    team: true
  },
  manager: {
    surveys: true,
    analytics: true,
    dispatchers: true,
    credits: false,
    team: false
  },
  analyst: {
    surveys: false,
    analytics: true,
    dispatchers: false,
    credits: false,
    team: false
  },
  viewer: {
    surveys: false,
    analytics: true,
    dispatchers: false,
    credits: false,
    team: false
  }
};

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@empresa.com',
    phone: '+55 11 99999-0001',
    role: 'owner',
    status: 'active',
    joinedAt: '2024-01-01',
    lastActive: '2024-01-15 14:30',
    permissions: rolePermissions.owner
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    phone: '+55 11 99999-0002',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-01-05',
    lastActive: '2024-01-15 13:45',
    permissions: rolePermissions.admin
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro@empresa.com',
    role: 'manager',
    status: 'active',
    joinedAt: '2024-01-10',
    lastActive: '2024-01-15 10:20',
    permissions: rolePermissions.manager
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    email: 'ana@empresa.com',
    role: 'analyst',
    status: 'pending',
    joinedAt: '2024-01-14',
    lastActive: '-',
    permissions: rolePermissions.analyst
  }
];

export default function Team() {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'viewer' as TeamMember['role']
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'manager':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'analyst':
        return <User className="h-4 w-4 text-green-600" />;
      case 'viewer':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'analyst':
        return 'Analista';
      case 'viewer':
        return 'Visualizador';
      default:
        return role;
    }
  };

  const handleInvite = () => {
    if (!inviteData.email) {
      toast({
        title: "Email obrigatório",
        description: "Informe o email para enviar o convite.",
        variant: "destructive"
      });
      return;
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteData.email.split('@')[0],
      email: inviteData.email,
      role: inviteData.role,
      status: 'pending',
      joinedAt: new Date().toISOString().split('T')[0],
      lastActive: '-',
      permissions: rolePermissions[inviteData.role]
    };

    setTeamMembers(prev => [...prev, newMember]);
    setInviteData({ email: '', role: 'viewer' });
    setShowInviteForm(false);

    toast({
      title: "Convite enviado",
      description: `Convite enviado para ${inviteData.email}`,
    });
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id));
    toast({
      title: "Membro removido",
      description: "Membro removido da equipe com sucesso.",
    });
  };

  const handleChangeRole = (id: string, newRole: TeamMember['role']) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === id 
        ? { ...member, role: newRole, permissions: rolePermissions[newRole] }
        : member
    ));
    
    toast({
      title: "Permissão alterada",
      description: "Permissões do membro atualizadas.",
    });
  };

  const teamStats = {
    total: teamMembers.length,
    active: teamMembers.filter(m => m.status === 'active').length,
    pending: teamMembers.filter(m => m.status === 'pending').length,
    roles: {
      owner: teamMembers.filter(m => m.role === 'owner').length,
      admin: teamMembers.filter(m => m.role === 'admin').length,
      manager: teamMembers.filter(m => m.role === 'manager').length,
      analyst: teamMembers.filter(m => m.role === 'analyst').length,
      viewer: teamMembers.filter(m => m.role === 'viewer').length,
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie membros da equipe e suas permissões
          </p>
        </div>
        <Button onClick={() => setShowInviteForm(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Membro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {teamStats.active} ativos, {teamStats.pending} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.roles.owner + teamStats.roles.admin}</div>
            <p className="text-xs text-muted-foreground">
              Com acesso total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gerentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.roles.manager}</div>
            <p className="text-xs text-muted-foreground">
              Gerenciam pesquisas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Analistas/Viewers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.roles.analyst + teamStats.roles.viewer}</div>
            <p className="text-xs text-muted-foreground">
              Acesso limitado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Convite */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Convidar Novo Membro</CardTitle>
            <CardDescription>Envie um convite por email para um novo membro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Função</label>
                <Select 
                  value={inviteData.role} 
                  onValueChange={(value: TeamMember['role']) => setInviteData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="analyst">Analista</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleInvite}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Convite
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Membros */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>Lista de todos os membros e suas permissões</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <div>
                      <h4 className="font-medium">{member.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                        {member.phone && (
                          <>
                            <span>•</span>
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          member.status === 'active' ? 'default' :
                          member.status === 'pending' ? 'secondary' : 'outline'
                        }
                      >
                        {member.status === 'active' ? 'Ativo' :
                         member.status === 'pending' ? 'Pendente' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Último acesso: {member.lastActive !== '-' ? new Date(member.lastActive).toLocaleString('pt-BR') : 'Nunca'}
                    </p>
                  </div>

                  {member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Alterar Função
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Níveis de Permissão */}
      <Card>
        <CardHeader>
          <CardTitle>Níveis de Permissão</CardTitle>
          <CardDescription>Entenda o que cada função pode fazer na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <div key={role} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getRoleIcon(role)}
                  <h4 className="font-medium">{getRoleLabel(role)}</h4>
                </div>
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-1 ${permissions.surveys ? 'text-green-600' : 'text-gray-400'}`}>
                    {permissions.surveys ? '✓' : '✗'} Pesquisas
                  </div>
                  <div className={`flex items-center gap-1 ${permissions.analytics ? 'text-green-600' : 'text-gray-400'}`}>
                    {permissions.analytics ? '✓' : '✗'} Analytics
                  </div>
                  <div className={`flex items-center gap-1 ${permissions.dispatchers ? 'text-green-600' : 'text-gray-400'}`}>
                    {permissions.dispatchers ? '✓' : '✗'} Disparadores
                  </div>
                  <div className={`flex items-center gap-1 ${permissions.credits ? 'text-green-600' : 'text-gray-400'}`}>
                    {permissions.credits ? '✓' : '✗'} Créditos
                  </div>
                  <div className={`flex items-center gap-1 ${permissions.team ? 'text-green-600' : 'text-gray-400'}`}>
                    {permissions.team ? '✓' : '✗'} Equipe
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}