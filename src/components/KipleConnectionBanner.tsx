import { AlertTriangle, CheckCircle2, Loader2, Database, X } from "lucide-react";
import { useState } from "react";
import type { ConnectionStatus } from "@/hooks/useKipleData";

interface Props {
  status: ConnectionStatus;
}

const SQL_SETUP = `-- Execute no seu projeto Kiple (npugwpifxpwymyecyyhe)
CREATE TABLE IF NOT EXISTS public.employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  department TEXT,
  team TEXT,
  tenure INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  turnover_risk TEXT DEFAULT 'low',
  performance TEXT DEFAULT 'medium',
  turnover_cost NUMERIC DEFAULT 0,
  email TEXT,
  join_date DATE,
  last_survey DATE,
  career_progress INTEGER DEFAULT 0,
  skills_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  lead TEXT,
  size INTEGER DEFAULT 0,
  engagement_avg NUMERIC DEFAULT 0,
  turnover_rate NUMERIC DEFAULT 0,
  performance TEXT DEFAULT 'medium',
  at_risk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar leitura pública (ajuste conforme sua política)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow anon read teams" ON public.teams FOR SELECT USING (true);`;

export function KipleConnectionBanner({ status }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);

  if (dismissed || status === "checking") return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SETUP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "connected") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg text-xs text-success mb-4">
        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="font-medium">Conectado ao banco Kiple</span>
        <span className="text-success/70">— exibindo dados reais</span>
        <button onClick={() => setDismissed(true)} className="ml-auto text-success/50 hover:text-success">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (status === "no-tables") {
    return (
      <div className="mb-4 bg-warning/5 border border-warning/20 rounded-xl p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <Database className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning">Banco Kiple conectado — tabelas não encontradas</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                As tabelas <code className="bg-muted px-1 rounded">employees</code> e <code className="bg-muted px-1 rounded">teams</code> ainda não existem no schema público do Kiple.
                Exibindo dados de demonstração.
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => setShowSQL(!showSQL)}
                  className="text-xs font-medium text-warning hover:underline"
                >
                  {showSQL ? "Ocultar SQL" : "Ver SQL para criar as tabelas"}
                </button>
              </div>
              {showSQL && (
                <div className="mt-3 relative">
                  <pre className="text-[10px] bg-muted/60 border border-border rounded-lg p-3 overflow-x-auto max-h-48 text-muted-foreground leading-relaxed">
                    {SQL_SETUP}
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 text-[10px] bg-card border border-border rounded px-2 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? "✓ Copiado!" : "Copiar"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-xs text-danger mb-4">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Erro ao conectar ao banco Kiple — exibindo dados de demonstração</span>
        <button onClick={() => setDismissed(true)} className="ml-auto text-danger/50 hover:text-danger">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
