import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CheckCircle2, Copy, Database, ExternalLink, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKipleData } from "@/hooks/useKipleData";

const KIPLE_DASHBOARD_URL = "https://supabase.com/dashboard/project/npugwpifxpwymyecyyhe/sql/new";

const SQL_FULL = `-- ============================================================
-- KIPLE · Script completo de setup do banco de dados
-- Execute no SQL Editor do seu projeto Kiple
-- https://supabase.com/dashboard/project/npugwpifxpwymyecyyhe/sql/new
-- ============================================================

-- ─── 1. ENUM TYPES ───────────────────────────────────────────
CREATE TYPE IF NOT EXISTS public.turnover_risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE IF NOT EXISTS public.performance_level AS ENUM ('low', 'medium', 'high', 'star');
CREATE TYPE IF NOT EXISTS public.alert_type AS ENUM ('info', 'warning', 'danger', 'success');

-- ─── 2. DEPARTMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  color       TEXT DEFAULT '#6366F1',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. TEAMS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  department      TEXT NOT NULL,
  lead            TEXT,
  size            INTEGER DEFAULT 0,
  engagement_avg  NUMERIC(5,2) DEFAULT 0,
  turnover_rate   NUMERIC(5,2) DEFAULT 0,
  performance     TEXT DEFAULT 'medium',
  at_risk_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. EMPLOYEES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE,
  position         TEXT,
  department       TEXT,
  team             TEXT,
  tenure           INTEGER DEFAULT 0,           -- months
  engagement_score INTEGER DEFAULT 0,           -- 0-100
  turnover_risk    TEXT DEFAULT 'low',          -- low | medium | high
  performance      TEXT DEFAULT 'medium',       -- low | medium | high | star
  turnover_cost    NUMERIC(12,2) DEFAULT 0,
  join_date        DATE,
  last_survey      DATE,
  career_progress  INTEGER DEFAULT 0,           -- 0-100
  skills_score     INTEGER DEFAULT 0,           -- 0-100
  avatar           TEXT,
  active           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. ENGAGEMENT HISTORY (para gráficos de tendência) ──────
CREATE TABLE IF NOT EXISTS public.engagement_history (
  id          SERIAL PRIMARY KEY,
  month       TEXT NOT NULL,       -- ex: 'Jan', 'Fev'
  year        INTEGER NOT NULL,
  value       NUMERIC(5,2),        -- score médio empresa
  target      NUMERIC(5,2),        -- meta mínima
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. TURNOVER HISTORY ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.turnover_history (
  id          SERIAL PRIMARY KEY,
  month       TEXT NOT NULL,
  year        INTEGER NOT NULL,
  rate        NUMERIC(5,2),        -- taxa em %
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. ALERTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id          SERIAL PRIMARY KEY,
  type        TEXT DEFAULT 'info', -- info | warning | danger | success
  title       TEXT NOT NULL,
  message     TEXT,
  timestamp   TEXT DEFAULT 'agora',
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. COMPANY SETTINGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_settings (
  id                        SERIAL PRIMARY KEY,
  company_name              TEXT DEFAULT 'Minha Empresa',
  sector                    TEXT,
  country                   TEXT DEFAULT 'Brasil',
  min_engagement_goal       NUMERIC(5,2) DEFAULT 75,
  max_turnover_goal         NUMERIC(5,2) DEFAULT 10,
  min_nps_goal              NUMERIC(4,2) DEFAULT 7.5,
  survey_frequency          TEXT DEFAULT 'monthly',
  survey_language           TEXT DEFAULT 'pt-br',
  notif_turnover_realtime   BOOLEAN DEFAULT TRUE,
  notif_monthly_report      BOOLEAN DEFAULT TRUE,
  notif_weekly_summary      BOOLEAN DEFAULT FALSE,
  notif_low_engagement      BOOLEAN DEFAULT TRUE,
  notif_survey_responses    BOOLEAN DEFAULT FALSE,
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE public.departments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnover_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings  ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (anon key)
CREATE POLICY "anon_read_departments"        ON public.departments        FOR SELECT USING (true);
CREATE POLICY "anon_read_teams"              ON public.teams              FOR SELECT USING (true);
CREATE POLICY "anon_read_employees"          ON public.employees          FOR SELECT USING (true);
CREATE POLICY "anon_read_engagement_history" ON public.engagement_history FOR SELECT USING (true);
CREATE POLICY "anon_read_turnover_history"   ON public.turnover_history   FOR SELECT USING (true);
CREATE POLICY "anon_read_alerts"             ON public.alerts             FOR SELECT USING (true);
CREATE POLICY "anon_read_company_settings"   ON public.company_settings   FOR SELECT USING (true);

-- ─── 10. TRIGGER: atualizar updated_at em employees ──────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 11. DADOS DE EXEMPLO ─────────────────────────────────────

INSERT INTO public.departments (name, color) VALUES
  ('Tecnologia',  '#2563EB'),
  ('Produto',     '#10B981'),
  ('Comercial',   '#F59E0B'),
  ('RH',          '#8B5CF6'),
  ('Marketing',   '#EC4899'),
  ('Financeiro',  '#06B6D4')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.teams (name, department, lead, size, engagement_avg, turnover_rate, performance, at_risk_count) VALUES
  ('Squad Alpha',     'Tecnologia',  'João Silva',     8,  89, 8.5,  'star',   0),
  ('Data & Analytics','Tecnologia',  'Carlos Mendes',  5,  62, 24.0, 'medium', 2),
  ('Design System',   'Produto',     'Ana Oliveira',   6,  93, 4.2,  'star',   0),
  ('Sales Enterprise','Comercial',   'Rafael Costa',   12, 76, 15.3, 'high',   1),
  ('People & Culture','RH',          'Maria Santos',   4,  84, 10.0, 'high',   0),
  ('Finance',         'Financeiro',  'Lucas Rocha',    7,  80, 7.5,  'high',   0),
  ('Growth',          'Marketing',   'Patricia Souza', 9,  88, 6.8,  'star',   0),
  ('Squad Beta',      'Tecnologia',  'Fernanda Lima',  7,  58, 28.6, 'low',    3);

INSERT INTO public.employees (name, email, position, department, team, tenure, engagement_score, turnover_risk, performance, turnover_cost, join_date, last_survey, career_progress, skills_score) VALUES
  ('João Silva',     'joao.silva@empresa.com',     'Desenvolvedor Sênior', 'Tecnologia', 'Squad Alpha',      24, 92, 'low',    'star',   0,     '2022-03-15', '2024-01-10', 78, 88),
  ('Maria Santos',   'maria.santos@empresa.com',   'HR Manager',           'RH',         'People & Culture', 36, 88, 'medium', 'high',   45000, '2021-01-20', '2024-01-08', 65, 82),
  ('Carlos Mendes',  'carlos.mendes@empresa.com',  'Analista de Dados',    'Tecnologia', 'Data & Analytics', 8,  61, 'high',   'medium', 32000, '2023-05-10', '2024-01-05', 32, 64),
  ('Ana Oliveira',   'ana.oliveira@empresa.com',   'Product Designer',     'Produto',    'Design System',    18, 95, 'low',    'star',   0,     '2022-07-01', '2024-01-11', 82, 91),
  ('Rafael Costa',   'rafael.costa@empresa.com',   'Gerente de Vendas',    'Comercial',  'Sales Enterprise', 14, 74, 'medium', 'high',   28000, '2022-11-15', '2024-01-07', 55, 72),
  ('Fernanda Lima',  'fernanda.lima@empresa.com',  'Engenheira de Software','Tecnologia','Squad Beta',       6,  55, 'high',   'medium', 38000, '2023-07-20', '2023-12-28', 28, 59),
  ('Lucas Rocha',    'lucas.rocha@empresa.com',    'Analista Financeiro',  'Financeiro', 'Finance',          48, 82, 'low',    'high',   0,     '2020-02-10', '2024-01-09', 70, 79),
  ('Patricia Souza', 'patricia.souza@empresa.com', 'Marketing Lead',       'Marketing',  'Growth',           22, 90, 'low',    'star',   0,     '2022-04-05', '2024-01-10', 75, 85);

INSERT INTO public.engagement_history (month, year, value, target) VALUES
  ('Ago', 2023, 78, 72), ('Set', 2023, 81, 74), ('Out', 2023, 79, 71),
  ('Nov', 2023, 84, 76), ('Dez', 2023, 88, 80), ('Jan', 2024, 91, 83);

INSERT INTO public.turnover_history (month, year, rate) VALUES
  ('Ago', 2023, 16.2), ('Set', 2023, 15.8), ('Out', 2023, 14.5),
  ('Nov', 2023, 13.9), ('Dez', 2023, 13.2), ('Jan', 2024, 12.8);

INSERT INTO public.alerts (type, title, message, timestamp, read) VALUES
  ('danger',  '3 funcionários em alto risco',        'Carlos Mendes, Fernanda Lima e mais 1 apresentam sinais de turnover iminente.', 'há 2h',  false),
  ('warning', 'Squad Beta com engajamento crítico',  'O engajamento do Squad Beta caiu 8 pontos no último mês (58%).', 'há 5h', false),
  ('info',    'Pesquisa de engajamento em aberto',   '47 funcionários ainda não responderam à pesquisa de Janeiro.', 'há 1d', true),
  ('success', 'Meta de turnover superada',           'O departamento de Produto atingiu taxa de turnover de 4.2% (meta: 8%).', 'há 2d', true);

INSERT INTO public.company_settings (company_name, sector, country) VALUES
  ('TechCorp Brasil', 'Tecnologia', 'Brasil')
ON CONFLICT DO NOTHING;
`;

interface Section {
  id: string;
  title: string;
  description: string;
  lines: string;
}

const SECTIONS: Section[] = [
  { id: "enums",    title: "1. Tipos (ENUMs)",            description: "turnover_risk, performance_level, alert_type", lines: "3 tipos" },
  { id: "depts",    title: "2. Departamentos",            description: "Tabela de departamentos com cores para gráficos", lines: "1 tabela" },
  { id: "teams",    title: "3. Equipes",                  description: "Equipes com métricas agregadas de engajamento e turnover", lines: "1 tabela" },
  { id: "employees",title: "4. Funcionários",             description: "Perfis completos com score de engajamento, risco e performance", lines: "1 tabela" },
  { id: "history",  title: "5. Histórico (Engaj. + Turn.)","description":"Séries temporais para os gráficos de tendência do dashboard", lines: "2 tabelas" },
  { id: "alerts",   title: "6. Alertas",                  description: "Alertas ativos exibidos no dashboard", lines: "1 tabela" },
  { id: "settings", title: "7. Configurações da Empresa", description: "Metas, preferências de pesquisa e notificações", lines: "1 tabela" },
  { id: "rls",      title: "8. Row Level Security",       description: "Políticas de acesso para leitura via anon key", lines: "7 policies" },
  { id: "data",     title: "9. Dados de Exemplo",         description: "Dados reais para testar o dashboard imediatamente", lines: "~30 registros" },
];

export default function DatabaseSetupPage() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("enums");
  const { connectionStatus, refetch, loading } = useKipleData();

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_FULL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isConnected = connectionStatus === "connected";

  return (
    <DashboardLayout title="Setup do Banco" subtitle="Configure as tabelas do projeto Kiple">
      <div className="max-w-4xl mx-auto">

        {/* Status banner */}
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-xl border mb-6",
          isConnected
            ? "bg-success/5 border-success/20"
            : "bg-warning/5 border-warning/20"
        )}>
          <div className={cn("p-2 rounded-lg", isConnected ? "bg-success/10" : "bg-warning/10")}>
            <Database className={cn("h-5 w-5", isConnected ? "text-success" : "text-warning")} />
          </div>
          <div className="flex-1">
            <p className={cn("text-sm font-semibold", isConnected ? "text-success" : "text-warning")}>
              {isConnected ? "Banco conectado e tabelas detectadas ✓" : "Tabelas ainda não criadas no banco Kiple"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isConnected
                ? "O dashboard está usando dados reais do banco Kiple (npugwpifxpwymyecyyhe)"
                : "Execute o SQL abaixo no painel do Kiple para criar todas as tabelas necessárias"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 flex-shrink-0"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Verificar conexão
          </Button>
        </div>

        {/* Step 1 */}
        <div className="bg-card border border-border rounded-xl p-5 card-shadow mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
            <h3 className="text-sm font-semibold text-foreground">Abrir o SQL Editor do Kiple</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3 ml-8">
            Acesse o painel do seu projeto Supabase Kiple e abra o SQL Editor para executar o script.
          </p>
          <div className="ml-8">
            <a href={KIPLE_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="h-8 text-xs gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir SQL Editor do Kiple
              </Button>
            </a>
          </div>
        </div>

        {/* Step 2 — Script */}
        <div className="bg-card border border-border rounded-xl p-5 card-shadow mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
              <h3 className="text-sm font-semibold text-foreground">Copiar e executar o SQL</h3>
            </div>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleCopy}
              variant={copied ? "outline" : "default"}
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar SQL completo"}
            </Button>
          </div>

          {/* What's included */}
          <div className="ml-8 mb-4 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  {expanded === s.id
                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                  <span className="text-xs font-medium text-foreground">{s.title}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block">— {s.description}</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.lines}</span>
              </button>
            ))}
          </div>

          {/* SQL Preview */}
          <div className="ml-8 relative">
            <pre className="text-[10px] bg-muted/40 border border-border rounded-lg p-4 overflow-x-auto max-h-64 text-muted-foreground leading-relaxed font-mono">
              {SQL_FULL.slice(0, 1200)}
              <span className="text-muted-foreground/40">{"\n\n... (script completo copiado acima)"}</span>
            </pre>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border rounded-xl p-5 card-shadow mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
            <h3 className="text-sm font-semibold text-foreground">Verificar conexão</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3 ml-8">
            Após executar o SQL, clique em "Verificar conexão" para confirmar que o dashboard está recebendo dados reais.
          </p>
          <div className="ml-8">
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              {loading ? "Verificando..." : "Verificar conexão agora"}
            </Button>
          </div>
        </div>

        {/* Table summary */}
        <div className="bg-card border border-border rounded-xl overflow-hidden card-shadow">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Resumo das Tabelas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">8 tabelas + 3 tipos + 1 trigger criados pelo script</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { table: "employees",         desc: "Perfis de funcionários com métricas individuais",        cols: "18 colunas", icon: "👤" },
              { table: "teams",             desc: "Equipes com métricas agregadas",                         cols: "10 colunas", icon: "👥" },
              { table: "departments",       desc: "Departamentos com cores para gráficos",                  cols: "4 colunas",  icon: "🏢" },
              { table: "engagement_history",desc: "Série temporal de engajamento para gráficos",            cols: "5 colunas",  icon: "📈" },
              { table: "turnover_history",  desc: "Série temporal de turnover para gráficos",               cols: "4 colunas",  icon: "📉" },
              { table: "alerts",            desc: "Alertas exibidos no dashboard",                          cols: "7 colunas",  icon: "🔔" },
              { table: "company_settings",  desc: "Configurações e metas da empresa",                       cols: "12 colunas", icon: "⚙️" },
            ].map((row) => (
              <div key={row.table} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base">{row.icon}</span>
                  <div>
                    <p className="text-xs font-mono font-medium text-foreground">{row.table}</p>
                    <p className="text-[11px] text-muted-foreground">{row.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">{row.cols}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
