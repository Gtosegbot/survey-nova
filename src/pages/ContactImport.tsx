import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Users, 
  Download, 
  FileText,
  Phone,
  Mail,
  Trash2,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  group?: string;
}

export default function ContactImport() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [manualContact, setManualContact] = useState({
    name: "",
    email: "",
    phone: "",
    group: ""
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      if (file.name.endsWith('.csv')) {
        parseCSV(text);
      } else if (file.name.endsWith('.txt')) {
        parseText(text);
      } else {
        toast({
          title: "Formato não suportado",
          description: "Por favor, envie um arquivo CSV ou TXT.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const newContacts: Contact[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= headers.length && values[0]) {
        const contact: Contact = {
          id: Date.now().toString() + i,
          name: "",
          email: "",
          phone: "",
          group: ""
        };

        headers.forEach((header, index) => {
          if (header.includes('nome') || header.includes('name')) {
            contact.name = values[index];
          } else if (header.includes('email') || header.includes('e-mail')) {
            contact.email = values[index];
          } else if (header.includes('telefone') || header.includes('phone') || header.includes('celular')) {
            contact.phone = values[index];
          } else if (header.includes('grupo') || header.includes('group')) {
            contact.group = values[index];
          }
        });

        if (contact.name) {
          newContacts.push(contact);
        }
      }
    }

    setContacts(prev => [...prev, ...newContacts]);
    toast({
      title: "Sucesso!",
      description: `${newContacts.length} contatos importados do CSV.`,
    });
  };

  const parseText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newContacts: Contact[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[,;|\t]/).map(p => p.trim());
      if (parts[0]) {
        newContacts.push({
          id: Date.now().toString() + index,
          name: parts[0],
          email: parts[1] || "",
          phone: parts[2] || "",
          group: parts[3] || ""
        });
      }
    });

    setContacts(prev => [...prev, ...newContacts]);
    toast({
      title: "Sucesso!",
      description: `${newContacts.length} contatos importados do arquivo de texto.`,
    });
  };

  const addManualContact = () => {
    if (!manualContact.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      ...manualContact
    };

    setContacts(prev => [...prev, newContact]);
    setManualContact({ name: "", email: "", phone: "", group: "" });
    
    toast({
      title: "Contato adicionado",
      description: "Contato adicionado com sucesso.",
    });
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const downloadTemplate = () => {
    const csvContent = "Nome,Email,Telefone,Grupo\nJoão Silva,joao@email.com,(11) 99999-9999,Clientes\nMaria Santos,maria@email.com,(11) 88888-8888,Prospects";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_contatos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const saveContacts = () => {
    if (contacts.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum contato para salvar.",
        variant: "destructive"
      });
      return;
    }

    // Salvar no localStorage temporariamente
    const existingContacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const allContacts = [...existingContacts, ...contacts];
    localStorage.setItem('contacts', JSON.stringify(allContacts));

    toast({
      title: "Sucesso!",
      description: `${contacts.length} contatos salvos!`,
    });

    setContacts([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Importar Contatos</h1>
        <p className="text-muted-foreground">Importe contatos para envio de pesquisas</p>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Arquivo
            </CardTitle>
            <CardDescription>
              Importe contatos de arquivo CSV ou TXT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Formatos aceitos: CSV, TXT
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Baixar Template CSV
            </Button>
          </CardContent>
        </Card>

        {/* Manual Addition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Adicionar Manualmente
            </CardTitle>
            <CardDescription>
              Adicione contatos um por vez
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={manualContact.name}
                onChange={(e) => setManualContact(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={manualContact.email}
                onChange={(e) => setManualContact(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={manualContact.phone}
                onChange={(e) => setManualContact(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="group">Grupo</Label>
              <Input
                id="group"
                value={manualContact.group}
                onChange={(e) => setManualContact(prev => ({ ...prev, group: e.target.value }))}
                placeholder="Ex: Clientes, Prospects"
              />
            </div>
            <Button onClick={addManualContact} className="w-full">
              <Check className="mr-2 h-4 w-4" />
              Adicionar Contato
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contact List */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Contatos Importados</CardTitle>
                <CardDescription>{contacts.length} contatos prontos para salvar</CardDescription>
              </div>
              <Badge variant="outline">{contacts.length} contatos</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-muted-foreground flex gap-4">
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </span>
                      )}
                      {contact.group && (
                        <Badge variant="secondary" className="text-xs">
                          {contact.group}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContact(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={saveContacts} className="flex-1">
                Salvar {contacts.length} Contatos
              </Button>
              <Button variant="outline" onClick={() => setContacts([])}>
                Limpar Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instruções de Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Formato CSV</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Primeira linha deve conter os cabeçalhos</li>
                <li>• Colunas: Nome, Email, Telefone, Grupo</li>
                <li>• Use vírgulas para separar os campos</li>
                <li>• Nome é obrigatório</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Formato TXT</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Uma linha por contato</li>
                <li>• Separar dados por vírgula, ponto e vírgula ou tab</li>
                <li>• Ordem: Nome, Email, Telefone, Grupo</li>
                <li>• Apenas o nome é obrigatório</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}