import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Copy, Check, Users, TrendingUp } from "lucide-react";

interface ReferralData {
  referral_code: string;
  total_referred: number;
  completed_referrals: number;
  pending_referrals: number;
  total_earned: number;
}

export default function Referrals() {
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar código de referral do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      // Contar referrals
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      if (error) throw error;

      const completed = referrals?.filter(r => r.status === 'completed').length || 0;
      const pending = referrals?.filter(r => r.status === 'pending').length || 0;

      setReferralData({
        referral_code: profile?.referral_code || '',
        total_referred: referrals?.length || 0,
        completed_referrals: completed,
        pending_referrals: pending,
        total_earned: completed * 50 // R$ 50 por indicação completada
      });
    } catch (error) {
      console.error('Erro ao carregar dados de referral:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!referralData?.referral_code) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${referralData.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "O link de indicação foi copiado para a área de transferência."
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Programa de Indicação
          </h1>
          <p className="text-muted-foreground">
            Ganhe R$ 50 para cada amigo que se cadastrar e recarregar créditos
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <TrendingUp className="h-4 w-4 mr-2" />
          R$ {referralData?.total_earned || 0} ganhos
        </Badge>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Indicações
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralData?.total_referred || 0}</div>
            <p className="text-xs text-muted-foreground">
              pessoas convidadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Indicações Completas
            </CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralData?.completed_referrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              com recarga efetuada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralData?.pending_referrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              aguardando primeira recarga
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Link de Indicação */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Link de Indicação</CardTitle>
          <CardDescription>
            Compartilhe este link com seus amigos. Quando eles se cadastrarem e fizerem a primeira recarga:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
              {referralData?.referral_code 
                ? `${window.location.origin}/auth?ref=${referralData.referral_code}`
                : 'Gerando código...'}
            </div>
            <Button onClick={copyReferralLink} disabled={!referralData?.referral_code}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Seu amigo ganha</h4>
                <p className="text-sm text-muted-foreground">R$ 20 de bônus de boas-vindas</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Você ganha</h4>
                <p className="text-sm text-muted-foreground">R$ 50 de recompensa por indicação</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Como funciona */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
              1
            </div>
            <div>
              <h4 className="font-medium">Compartilhe seu link</h4>
              <p className="text-sm text-muted-foreground">
                Envie o link de indicação para seus amigos, colegas ou clientes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
              2
            </div>
            <div>
              <h4 className="font-medium">Eles se cadastram</h4>
              <p className="text-sm text-muted-foreground">
                Quando alguém usar seu link para criar uma conta, a indicação será registrada.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
              3
            </div>
            <div>
              <h4 className="font-medium">Primeira recarga</h4>
              <p className="text-sm text-muted-foreground">
                Assim que seu amigo fizer a primeira recarga de créditos, vocês dois recebem os bônus automaticamente!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
