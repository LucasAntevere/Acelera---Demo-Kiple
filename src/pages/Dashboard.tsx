import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, UserCheck, UserX, BriefcaseMedical, FileClock, CalendarClock, Loader2 } from "lucide-react";
import { useDashboardRh } from "@/hooks/useDashboardRh";

function fmtDate(date?: string | null) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function Dashboard() {
  const { data, loading } = useDashboardRh();

  const cards = [
    { label: "Total de Funcionarios", value: data.totalFuncionarios, icon: Users, color: "text-primary" },
    { label: "Ativos", value: data.funcionariosAtivos, icon: UserCheck, color: "text-success" },
    { label: "Inativos", value: data.funcionariosInativos, icon: UserX, color: "text-warning" },
    { label: "Beneficios Ativos", value: data.beneficiosAtivos, icon: BriefcaseMedical, color: "text-primary" },
    { label: "Vinculos Ativos", value: data.vinculosAtivos, icon: Users, color: "text-success" },
    { label: "Desligamentos no Periodo", value: data.desligamentosPeriodo, icon: FileClock, color: "text-danger" },
  ];

  return (
    <DashboardLayout title="Dashboard" subtitle="Visao operacional de RH">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Painel RH
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Acompanhamento diario de funcionarios, beneficios e desligamentos</p>
        </div>
        <div className="flex gap-2">
          <Link to="/funcionarios"><Button size="sm" className="h-8 text-xs">Novo Funcionario</Button></Link>
          <Link to="/beneficios"><Button size="sm" variant="outline" className="h-8 text-xs">Novo Beneficio</Button></Link>
          <Link to="/desligamentos"><Button size="sm" variant="outline" className="h-8 text-xs">Novo Desligamento</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 card-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden xl:col-span-1">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Ultimos Desligamentos</h3>
          </div>
          <div className="divide-y divide-border">
            {data.ultimosDesligamentos.length === 0 && <p className="px-4 py-4 text-xs text-muted-foreground">Nenhum desligamento registrado.</p>}
            {data.ultimosDesligamentos.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{item.funcionario_nome ?? `Funcionario #${item.funcionario_id}`}</p>
                <p className="text-xs text-muted-foreground">{item.motivo_nome ?? "Motivo"} • {fmtDate(item.data_pedido)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden xl:col-span-1">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Contratacoes Recentes</h3>
          </div>
          <div className="divide-y divide-border">
            {data.contratacoesRecentes.length === 0 && <p className="px-4 py-4 text-xs text-muted-foreground">Nenhuma contratacao registrada.</p>}
            {data.contratacoesRecentes.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{item.nome}</p>
                <p className="text-xs text-muted-foreground">Admissao: {fmtDate(item.data_contratacao)} • {item.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden xl:col-span-1">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Proximos Desligamentos</h3>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {data.proximosDesligamentos.length === 0 && <p className="px-4 py-4 text-xs text-muted-foreground">Sem desligamentos previstos.</p>}
            {data.proximosDesligamentos.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{item.funcionario_nome ?? `Funcionario #${item.funcionario_id}`}</p>
                <p className="text-xs text-muted-foreground">Saida prevista: {fmtDate(item.data_prevista_saida)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
