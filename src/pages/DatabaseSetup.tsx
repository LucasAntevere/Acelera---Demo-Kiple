import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Database, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const KIPLE_DASHBOARD_URL = "https://supabase.com/dashboard/project/npugwpifxpwymyecyyhe/sql/new";
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

interface SetupResult {
  success: boolean;
  succeeded: number;
  failed: number;
  message: string;
  details?: { sql: string; error?: string }[];
}

const TABLES = [
  "departamentos",
  "funcionarios",
  "beneficios",
  "funcionario_beneficios",
  "motivos_desligamento",
  "desligamentos",
];

const ENUMS = ["status_ativo", "funcionario_sexo", "beneficio_tipo", "tipo_desligamento"];

export default function DatabaseSetupPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);

  const handleAutoSetup = async () => {
    setRunning(true);
    setResult(null);
    try {
      const fnUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/kiple-setup`;
      const res = await fetch(fnUrl, { method: "POST" });
      const data: SetupResult = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ success: false, succeeded: 0, failed: 1, message: `Erro: ${e.message}` });
    } finally {
      setRunning(false);
    }
  };

  return (
    <DashboardLayout title="Setup do Banco" subtitle="Schema RH operacional no Supabase">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-6 card-shadow mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Database className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Criação automática do novo domínio RH</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Executa enums, tabelas, constraints, RLS, triggers de data_atualizacao e seeds mínimos para o modelo operacional.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/30 rounded-lg p-3" aria-label="Lista de enums que serão criados">
              <p className="text-xs font-semibold text-foreground mb-1">Enums</p>
              {ENUMS.map((e) => <p key={e} className="text-xs text-muted-foreground">{e}</p>)}
            </div>
            <div className="bg-muted/30 rounded-lg p-3" aria-label="Lista de tabelas que serão criadas">
              <p className="text-xs font-semibold text-foreground mb-1">Tabelas</p>
              {TABLES.map((t) => <p key={t} className="text-xs text-muted-foreground">{t}</p>)}
            </div>
          </div>

          <Button className="w-full gap-2 h-10" onClick={handleAutoSetup} disabled={running} title="Executar setup automático do banco" aria-label="Executar setup automático do banco">
            {running ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Executando setup...</> : "Criar schema RH agora"}
          </Button>

          {result && (
            <div className={cn(
              "mt-4 p-3 rounded-lg text-xs border",
              result.success ? "bg-success/5 border-success/20 text-success" : "bg-danger/5 border-danger/20 text-danger"
            )}>
              <div className="flex items-center gap-1.5 font-medium mb-1">
                {result.success ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                {result.message}
              </div>
              {result.details && result.details.length > 0 && (
                <div className="mt-2 space-y-1">
                  {result.details.map((d, i) => (
                    <p key={i} className="text-[10px] font-mono text-danger/80">x {d.sql} {"->"} {d.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 card-shadow">
          <p className="text-xs text-muted-foreground mb-3">
            Se preferir, você pode executar manualmente no SQL Editor do projeto Supabase.
          </p>
          <a href={KIPLE_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" aria-label="Abrir SQL Editor do Supabase">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" title="Abrir SQL Editor do Supabase">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Abrir SQL Editor
            </Button>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
