import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  FileText, Download, Calendar, TrendingUp,
  Users, BarChart3, ArrowUpRight, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const reports = [
  {
    id: 1,
    title: "Relatório de Engajamento",
    description: "Análise completa do engajamento por equipe, departamento e tendências mensais.",
    period: "Janeiro 2024",
    status: "ready",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "primary",
    size: "2.4 MB",
  },
  {
    id: 2,
    title: "Análise de Turnover",
    description: "Taxa de turnover, custo estimado, padrões de desligamento e benchmarks do setor.",
    period: "Janeiro 2024",
    status: "ready",
    icon: <BarChart3 className="h-5 w-5" />,
    color: "warning",
    size: "1.8 MB",
  },
  {
    id: 3,
    title: "Performance da Força de Trabalho",
    description: "Distribuição de performance, identificação de talentos e gaps de habilidades.",
    period: "Q4 2023",
    status: "ready",
    icon: <Users className="h-5 w-5" />,
    color: "success",
    size: "3.1 MB",
  },
  {
    id: 4,
    title: "Sumário Executivo",
    description: "Resumo executivo com os principais KPIs e recomendações estratégicas.",
    period: "Janeiro 2024",
    status: "generating",
    icon: <FileText className="h-5 w-5" />,
    color: "danger",
    size: "—",
  },
];

const colorMap = {
  primary: { icon: "bg-primary/10 text-primary", badge: "text-primary" },
  warning: { icon: "bg-warning/10 text-warning", badge: "text-warning" },
  success: { icon: "bg-success/10 text-success", badge: "text-success" },
  danger: { icon: "bg-danger/10 text-danger", badge: "text-danger" },
} as const;

const scheduledReports = [
  { name: "Relatório Mensal de Engajamento", frequency: "Mensal", nextRun: "01/02/2024", recipients: 4 },
  { name: "Alerta de Turnover Semanal", frequency: "Semanal", nextRun: "15/01/2024", recipients: 2 },
  { name: "Sumário Executivo Trimestral", frequency: "Trimestral", nextRun: "01/04/2024", recipients: 6 },
];

export default function ReportsPage() {
  return (
    <DashboardLayout title="Relatórios" subtitle="Gere e exporte análises detalhadas">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Análises e exportações disponíveis</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Novo Relatório
        </Button>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {reports.map((report) => {
          const colors = colorMap[report.color as keyof typeof colorMap];
          return (
            <div key={report.id} className="bg-card border border-border rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all animate-slide-in">
              <div className="flex items-start gap-3">
                <div className={cn("p-2.5 rounded-lg flex-shrink-0", colors.icon)}>
                  {report.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{report.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{report.description}</p>
                    </div>
                    {report.status === "ready" ? (
                      <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.period}
                      </span>
                      {report.size !== "—" && <span>{report.size}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={report.status !== "ready"}
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={report.status !== "ready"}
                      >
                        <Download className="h-3 w-3" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheduled Reports */}
      <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Relatórios Agendados</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Automações ativas de envio por email</p>
        </div>
        <div className="divide-y divide-border">
          {scheduledReports.map((r) => (
            <div key={r.name} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Próximo: {r.nextRun} • {r.recipients} destinatários</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">{r.frequency}</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs">Editar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
