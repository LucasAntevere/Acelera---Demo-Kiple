import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RiskBadge, PerformanceBadge, EngagementBar } from "@/components/metrics/StatusBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/kiple";
import { useKipleData } from "@/hooks/useKipleData";

function EmployeeDetail({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const recommendations = employee.performance === "star"
    ? ["Programa de liderança (Recomendado)", "Mentoria junior (Opcional)", "Aumento salarial (Próximo ciclo)"]
    : employee.turnoverRisk === "high"
    ? ["Reunião 1:1 urgente com liderança", "Revisão salarial imediata", "Plano de desenvolvimento personalizado"]
    : ["Treinamento de habilidades técnicas", "Participação em projetos cross-team", "Feedback estruturado mensal"];

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md card-shadow animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">
              {employee.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground">{employee.name}</h2>
            <p className="text-xs text-muted-foreground">{employee.position} • {employee.department}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Engajamento", value: `${employee.engagementScore}%`, color: employee.engagementScore >= 80 ? "text-success" : employee.engagementScore >= 65 ? "text-warning" : "text-danger" },
            { label: "Tempo na Empresa", value: `${employee.tenure}m`, color: "text-primary" },
            { label: "Progressão", value: `${employee.careerProgress}%`, color: "text-primary" },
            { label: "Skills Score", value: `${employee.skillsScore}%`, color: "text-success" },
          ].map((m) => (
            <div key={m.label} className="bg-muted/40 rounded-lg p-3">
              <p className={cn("text-base font-bold", m.color)}>{m.value}</p>
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Risco de Turnover</p>
            <RiskBadge risk={employee.turnoverRisk} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Performance</p>
            <PerformanceBadge level={employee.performance} />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1.5">Score de Engajamento</p>
          <EngagementBar score={employee.engagementScore} />
        </div>

        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-semibold text-foreground mb-2">Ações Recomendadas</p>
          <ul className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <Button className="w-full mt-4 text-xs h-8" size="sm">Ver Perfil Completo</Button>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selected, setSelected] = useState<Employee | null>(null);

  const { employees, connectionStatus, loading } = useKipleData();

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "all" || e.turnoverRisk === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <DashboardLayout title="Funcionários" subtitle="Perfis individuais e análise de risco">
      {selected && <EmployeeDetail employee={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Funcionários
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{employees.length} registros ativos</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar funcionário, cargo, departamento..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="h-9 w-full sm:w-40 text-sm">
            <SelectValue placeholder="Risco de Turnover" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os riscos</SelectItem>
            <SelectItem value="high">Alto risco</SelectItem>
            <SelectItem value="medium">Risco médio</SelectItem>
            <SelectItem value="low">Baixo risco</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Funcionário</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Departamento</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Engajamento</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Risco</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Performance</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Tempo</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr
                  key={emp.id}
                  className={cn("border-b border-border hover:bg-muted/20 cursor-pointer transition-colors", i % 2 === 0 ? "" : "bg-muted/5")}
                  onClick={() => setSelected(emp)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {emp.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-muted-foreground">{emp.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{emp.department}</td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <EngagementBar score={emp.engagementScore} />
                  </td>
                  <td className="px-4 py-3"><RiskBadge risk={emp.turnoverRisk} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><PerformanceBadge level={emp.performance} /></td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{emp.tenure} meses</td>
                  <td className="px-4 py-3"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && !loading && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum funcionário encontrado</p>
          </div>
        )}
        {loading && (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando dados...
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
