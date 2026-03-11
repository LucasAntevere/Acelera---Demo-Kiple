import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PerformanceBadge, EngagementBar } from "@/components/metrics/StatusBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, TrendingDown, Activity, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useKipleData } from "@/hooks/useKipleData";

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const { teams, connectionStatus, loading } = useKipleData();

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase())
  );

  const avgEngagement = teams.length
    ? (teams.reduce((s, t) => s + t.engagementAvg, 0) / teams.length).toFixed(0)
    : "0";
  const avgTurnover = teams.length
    ? (teams.reduce((s, t) => s + t.turnoverRate, 0) / teams.length).toFixed(1)
    : "0";
  const totalAtRisk = teams.reduce((s, t) => s + t.atRiskCount, 0);

  return (
    <DashboardLayout title="Equipes" subtitle="Gerencie e acompanhe todas as equipes">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Equipes
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{teams.length} equipes ativas</p>
        </div>
        <Button size="sm" className="h-8 text-xs">+ Nova Equipe</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total de Equipes", value: teams.length, icon: <Users className="h-4 w-4" />, color: "text-primary", bg: "bg-primary/10" },
          { label: "Eng. Médio", value: `${avgEngagement}%`, icon: <Activity className="h-4 w-4" />, color: "text-success", bg: "bg-success/10" },
          { label: "Turnover Médio", value: `${avgTurnover}%`, icon: <TrendingDown className="h-4 w-4" />, color: "text-warning", bg: "bg-warning/10" },
          { label: "Pessoas em Risco", value: totalAtRisk, icon: <AlertTriangle className="h-4 w-4" />, color: "text-danger", bg: "bg-danger/10" },
        ].map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-4 card-shadow">
            <div className={cn("inline-flex p-1.5 rounded-lg mb-2", item.bg)}>
              <span className={item.color}>{item.icon}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar equipes..."
          className="pl-9 h-9 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando equipes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((team) => (
            <div key={team.id} className="bg-card border border-border rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer group animate-slide-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{team.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{team.department} • Líder: {team.lead}</p>
                </div>
                <PerformanceBadge level={team.performance} />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Engajamento</span>
                    <span className="font-medium text-foreground">{team.engagementAvg}%</span>
                  </div>
                  <EngagementBar score={team.engagementAvg} />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{team.size}</p>
                    <p className="text-[10px] text-muted-foreground">Pessoas</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-xs font-semibold", team.turnoverRate > 15 ? "text-danger" : team.turnoverRate > 10 ? "text-warning" : "text-success")}>
                      {team.turnoverRate}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Turnover</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-xs font-semibold", team.atRiskCount > 0 ? "text-danger" : "text-success")}>
                      {team.atRiskCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Em Risco</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma equipe encontrada</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
