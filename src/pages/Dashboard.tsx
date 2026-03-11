import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/metrics/MetricCard";
import {
  Users, TrendingDown, Activity, AlertTriangle,
  DollarSign, ArrowUpRight, Loader2
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { RiskBadge, PerformanceBadge, EngagementBar } from "@/components/metrics/StatusBadges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useKipleData } from "@/hooks/useKipleData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-dropdown">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-medium">{p.value}{p.unit || "%"}</span></p>
        ))}
      </div>
    );
  }
  return null;
};

const alertBg: Record<string, string> = {
  danger: "border-l-danger bg-danger/5",
  warning: "border-l-warning bg-warning/5",
  info: "border-l-primary bg-primary/5",
  success: "border-l-success bg-success/5",
};

const alertText: Record<string, string> = {
  danger: "text-danger",
  warning: "text-warning",
  info: "text-primary",
  success: "text-success",
};

export default function Dashboard() {
  const {
    employees, teams, engagementTrend, turnoverTrend,
    departmentEngagement, performanceDistribution, alerts,
    connectionStatus, loading
  } = useKipleData();

  const atRiskEmployees = employees.filter(e => e.turnoverRisk === "high");
  const totalTurnoverCost = employees.reduce((sum, e) => sum + e.turnoverCost, 0);
  const avgEngagement = employees.length
    ? (employees.reduce((s, e) => s + e.engagementScore, 0) / employees.length).toFixed(1)
    : "0";
  const avgTurnoverRate = teams.length
    ? (teams.reduce((s, t) => s + t.turnoverRate, 0) / teams.length).toFixed(1)
    : "0";

  return (
    <DashboardLayout title="Dashboard" subtitle="Visão geral da sua força de trabalho">

      {/* Period selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Visão Geral
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {employees.length} funcionários • {teams.length} equipes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 3 meses</SelectItem>
              <SelectItem value="180d">Últimos 6 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-xs gap-1.5">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Engajamento Geral"
          value={avgEngagement}
          unit="%"
          icon={<Activity className="h-4 w-4" />}
          color="primary"
          trend={{ direction: "up", value: "+2.3%", label: "vs mês anterior", positiveIsUp: true }}
          target="Meta: 90%"
        />
        <MetricCard
          title="Taxa de Turnover"
          value={avgTurnoverRate}
          unit="%"
          icon={<TrendingDown className="h-4 w-4" />}
          color="warning"
          trend={{ direction: "down", value: "−1.2%", label: "vs mês anterior", positiveIsUp: false }}
          target="Meta: < 10%"
        />
        <MetricCard
          title="Funcionários em Risco"
          value={atRiskEmployees.length}
          unit="pessoas"
          icon={<AlertTriangle className="h-4 w-4" />}
          color="danger"
          trend={{ direction: "up", value: "+1", label: "vs mês anterior", positiveIsUp: false }}
          target="Meta: 0 em risco alto"
        />
        <MetricCard
          title="Custo de Turnover"
          value={`R$ ${(totalTurnoverCost / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-4 w-4" />}
          color="success"
          trend={{ direction: "down", value: "−12%", label: "vs mês anterior", positiveIsUp: false }}
          target="Custo estimado acumulado"
        />
      </div>

      {/* Alerts + Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Alertas */}
        <div className="xl:col-span-1">
          <div className="bg-card border border-border rounded-xl p-4 card-shadow h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Alertas Ativos</h3>
              <span className="text-xs text-muted-foreground">{alerts.length} alertas</span>
            </div>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className={cn("border-l-2 rounded-r-lg p-3 text-xs", alertBg[alert.type])}>
                  <p className={cn("font-semibold mb-0.5", alertText[alert.type])}>{alert.title}</p>
                  <p className="text-muted-foreground leading-relaxed line-clamp-2">{alert.message}</p>
                  <p className="text-muted-foreground/60 mt-1">{alert.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Trend */}
        <div className="xl:col-span-2">
          <div className="bg-card border border-border rounded-xl p-4 card-shadow h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Evolução do Engajamento</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Empresa vs Meta (6 meses)</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={engagementTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="value" name="Engajamento" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }} />
                <Line type="monotone" dataKey="secondary" name="Meta Mínima" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        {/* Turnover trend */}
        <div className="bg-card border border-border rounded-xl p-4 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-1">Turnover Mensal</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses (%)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={turnoverTrend} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Turnover" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dept Engagement */}
        <div className="bg-card border border-border rounded-xl p-4 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-1">Engajamento por Dept.</h3>
          <p className="text-xs text-muted-foreground mb-3">Score médio atual</p>
          <div className="space-y-2.5">
            {departmentEngagement.map((dept) => (
              <div key={dept.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{dept.name}</span>
                  <span className="text-muted-foreground">{dept.value}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${dept.value}%`, backgroundColor: dept.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance distribution */}
        <div className="bg-card border border-border rounded-xl p-4 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-1">Distribuição de Performance</h3>
          <p className="text-xs text-muted-foreground mb-2">Total de funcionários por nível</p>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={performanceDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} pessoas`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {performanceDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}: <span className="font-medium text-foreground">{item.value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team overview table */}
      <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Visão por Equipe</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Performance e engajamento por equipe</p>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs">Ver todas</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Equipe</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium hidden sm:table-cell">Departamento</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Engajamento</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium hidden md:table-cell">Turnover</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Performance</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium hidden lg:table-cell">Em Risco</th>
              </tr>
            </thead>
            <tbody>
              {teams.slice(0, 6).map((team, i) => (
                <tr key={team.id} className={cn("border-b border-border hover:bg-muted/20 transition-colors cursor-pointer", i % 2 === 0 ? "" : "bg-muted/5")}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{team.name}</p>
                      <p className="text-muted-foreground">{team.size} pessoas</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{team.department}</td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <EngagementBar score={team.engagementAvg} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn("font-medium", team.turnoverRate > 15 ? "text-danger" : team.turnoverRate > 10 ? "text-warning" : "text-success")}>
                      {team.turnoverRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PerformanceBadge level={team.performance} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {team.atRiskCount > 0 ? (
                      <span className="text-danger font-medium">{team.atRiskCount} em risco</span>
                    ) : (
                      <span className="text-success">Nenhum</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
