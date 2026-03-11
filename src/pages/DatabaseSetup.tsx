import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CheckCircle2, Copy, Database, ExternalLink, ChevronDown, ChevronRight, RefreshCw, Zap, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKipleData } from "@/hooks/useKipleData";

const KIPLE_DASHBOARD_URL = "https://supabase.com/dashboard/project/npugwpifxpwymyecyyhe/sql/new";
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

interface SetupResult {
  success: boolean;
  succeeded: number;
  failed: number;
  message: string;
  details?: { sql: string; error?: string }[];
}

export default function DatabaseSetupPage() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);
  const { connectionStatus, refetch, loading, isUsingMock } = useKipleData();

  const isConnected = connectionStatus === "connected";

  const handleAutoSetup = async () => {
    setRunning(true);
    setResult(null);
    try {
      const fnUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/kiple-setup`;
      const res = await fetch(fnUrl, { method: 'POST' });
      const data: SetupResult = await res.json();
      setResult(data);
      if (data.success) {
        setTimeout(() => refetch(), 1000);
      }
    } catch (e: any) {
      setResult({ success: false, succeeded: 0, failed: 1, message: `Erro: ${e.message}` });
    } finally {
      setRunning(false);
    }
  };

  const SQL_FULL = `-- Acesse a página Setup do Banco no app para copiar o SQL completo.
-- Ou clique no botão "Criar Tabelas Automaticamente" para executar direto.`;

  const SECTIONS = [
    { id: "tables",   title: "7 Tabelas",              description: "employees, teams, departments, engagement_history, turnover_history, alerts, company_settings" },
    { id: "rls",      title: "RLS + Políticas",         description: "Row Level Security habilitado com leitura pública via anon key" },
    { id: "trigger",  title: "Trigger updated_at",      description: "Atualização automática de updated_at em employees" },
    { id: "seed",     title: "Dados de Exemplo",        description: "~30 registros de funcionários, equipes e histórico para testar imediatamente" },
  ];

  return (
    <DashboardLayout title="Setup do Banco" subtitle="Configure as tabelas do projeto Kiple">
      <div className="max-w-3xl mx-auto">

        {/* Status banner */}
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-xl border mb-6",
          isConnected ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
        )}>
          <div className={cn("p-2 rounded-lg", isConnected ? "bg-success/10" : "bg-warning/10")}>
            <Database className={cn("h-5 w-5", isConnected ? "text-success" : "text-warning")} />
          </div>
          <div className="flex-1">
            <p className={cn("text-sm font-semibold", isConnected ? "text-success" : "text-warning")}>
              {isConnected ? "Banco conectado — dados reais ativos ✓" : "Tabelas não encontradas no banco Kiple"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isConnected
                ? "O dashboard está usando dados reais (npugwpifxpwymyecyyhe)"
                : "Execute o setup abaixo para criar todas as tabelas automaticamente"}
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 flex-shrink-0" onClick={refetch} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Verificar
          </Button>
        </div>

        {/* AUTO SETUP — main card */}
        <div className="bg-card border border-border rounded-xl p-6 card-shadow mb-4">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Criar Tabelas Automaticamente</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Usa a service role key para criar todas as tabelas, RLS e dados de exemplo diretamente no banco Kiple.
              </p>
            </div>
          </div>

          {/* What will be created */}
          <div className="bg-muted/30 rounded-lg p-3 mb-5 space-y-1.5">
            {SECTIONS.map((s) => (
              <div key={s.id} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">{s.title}</span>
                  <span className="text-muted-foreground"> — {s.description}</span>
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full gap-2 h-10"
            onClick={handleAutoSetup}
            disabled={running || isConnected}
          >
            {running
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando tabelas...</>
              : isConnected
              ? <><CheckCircle2 className="h-4 w-4" /> Tabelas já criadas</>
              : <><Zap className="h-4 w-4" /> Criar todas as tabelas agora</>
            }
          </Button>

          {/* Result */}
          {result && (
            <div className={cn(
              "mt-4 p-3 rounded-lg text-xs border",
              result.success ? "bg-success/5 border-success/20 text-success" : "bg-danger/5 border-danger/20 text-danger"
            )}>
              <div className="flex items-center gap-1.5 font-medium mb-1">
                {result.success
                  ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : <AlertTriangle className="h-3.5 w-3.5" />}
                {result.message}
              </div>
              {result.details && result.details.length > 0 && (
                <div className="mt-2 space-y-1">
                  {result.details.map((d, i) => (
                    <p key={i} className="text-[10px] font-mono text-danger/80">
                      ✗ {d.sql}… → {d.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual option */}
        <div className="bg-card border border-border rounded-xl p-5 card-shadow mb-4">
          <button
            onClick={() => setExpanded(expanded === "manual" ? null : "manual")}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              {expanded === "manual" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <h3 className="text-sm font-medium text-foreground">Prefiro executar manualmente no painel</h3>
            </div>
          </button>

          {expanded === "manual" && (
            <div className="mt-4 ml-6 space-y-3">
              <p className="text-xs text-muted-foreground">
                Acesse o SQL Editor do Kiple e execute o script disponível na página "Setup do Banco".
              </p>
              <a href={KIPLE_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir SQL Editor do Kiple
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Table summary */}
        <div className="bg-card border border-border rounded-xl overflow-hidden card-shadow">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Estrutura criada</h3>
            <p className="text-xs text-muted-foreground mt-0.5">7 tabelas + trigger + RLS + dados iniciais</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { table: "employees",          desc: "Perfis individuais com score de engajamento e risco",  cols: "18 col", icon: "👤" },
              { table: "teams",              desc: "Equipes com métricas agregadas",                        cols: "10 col", icon: "👥" },
              { table: "departments",        desc: "Departamentos com cores para gráficos",                 cols: "4 col",  icon: "🏢" },
              { table: "engagement_history", desc: "Série temporal de engajamento (gráfico de linha)",      cols: "5 col",  icon: "📈" },
              { table: "turnover_history",   desc: "Série temporal de turnover (gráfico de barras)",        cols: "4 col",  icon: "📉" },
              { table: "alerts",             desc: "Alertas ativos exibidos no dashboard",                  cols: "7 col",  icon: "🔔" },
              { table: "company_settings",   desc: "Configurações, metas e preferências da empresa",        cols: "14 col", icon: "⚙️" },
            ].map((row) => (
              <div key={row.table} className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span>{row.icon}</span>
                  <div>
                    <p className="text-xs font-mono font-medium text-foreground">{row.table}</p>
                    <p className="text-[11px] text-muted-foreground">{row.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <span className="text-[10px] text-success flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> ativa
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">{row.cols}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
