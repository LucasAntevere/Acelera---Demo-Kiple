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
    { label: "Total de Funcionários", value: data.totalFuncionarios, icon: Users, color: "text-primary" },
    { label: "Ativos", value: data.funcionariosAtivos, icon: UserCheck, color: "text-success" },
    { label: "Inativos", value: data.funcionariosInativos, icon: UserX, color: "text-warning" },
    { label: "Benefícios Ativos", value: data.beneficiosAtivos, icon: BriefcaseMedical, color: "text-primary" },
    { label: "Vínculos Ativos", value: data.vinculosAtivos, icon: Users, color: "text-success" },
    { label: "Desligamentos no Período", value: data.desligamentosPeriodo, icon: FileClock, color: "text-danger" },
  ];

  return (
    <DashboardLayout title="Dashboard" subtitle="Visão operacional de RH">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Painel RH
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Carregando dados" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Acompanhamento diário de funcionários, benefícios e desligamentos</p>
        </div>
        <div className="flex gap-2">
          <Link to="/funcionarios" aria-label="Ir para cadastro de funcionários">
            <Button size="sm" className="h-8 text-xs" title="Cadastrar novo funcionário">Novo Funcionário</Button>
          </Link>
          <Link to="/beneficios" aria-label="Ir para cadastro de benefícios">
            <Button size="sm" variant="outline" className="h-8 text-xs" title="Cadastrar novo benefício">Novo Benefício</Button>
          </Link>
          <Link to="/desligamentos" aria-label="Ir para cadastro de desligamentos">
            <Button size="sm" variant="outline" className="h-8 text-xs" title="Registrar novo desligamento">Novo Desligamento</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 card-shadow" title={card.label} aria-label={card.label}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.color}`} aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden xl:col-span-1">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Últimos Desligamentos</h3>
          </div>
          <div className="divide-y divide-border">
            {data.ultimosDesligamentos.length === 0 && <p className="px-4 py-4 text-xs text-muted-foreground">Nenhum desligamento registrado.</p>}
            {data.ultimosDesligamentos.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{item.funcionario_nome ?? `Funcionário #${item.funcionario_id}`}</p>
                <p className="text-xs text-muted-foreground">{item.motivo_nome ?? "Motivo"} • {fmtDate(item.data_pedido)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden xl:col-span-1">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Contratações Recentes</h3>
          </div>
          <div className="divide-y divide-border">
            {data.contratacoesRecentes.length === 0 && <p className="px-4 py-4 text-xs text-muted-foreground">Nenhuma contratação registrada.</p>}
            {data.contratacoesRecentes.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{item.nome}</p>
                <p className="text-xs text-muted-foreground">Admissão: {fmtDate(item.data_contratacao)} • {item.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden xl:col-span-1">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Próximos Desligamentos</h3>
            <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="divide-y divide-border">
            {data.proximosDesligamentos.length === 0 && <p className="px-4 py-4 text-xs text-muted-foreground">Sem desligamentos previstos.</p>}
            {data.proximosDesligamentos.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{item.funcionario_nome ?? `Funcionário #${item.funcionario_id}`}</p>
                <p className="text-xs text-muted-foreground">Saída prevista: {fmtDate(item.data_prevista_saida)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
