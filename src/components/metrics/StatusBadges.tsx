import { cn } from "@/lib/utils";
import type { TurnoverRisk, PerformanceLevel } from "@/types/kiple";

export function RiskBadge({ risk }: { risk: TurnoverRisk }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      risk === "low" && "bg-success/10 text-success",
      risk === "medium" && "bg-warning/10 text-warning",
      risk === "high" && "bg-danger/10 text-danger",
    )}>
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        risk === "low" && "bg-success",
        risk === "medium" && "bg-warning",
        risk === "high" && "bg-danger",
      )} />
      {risk === "low" ? "Baixo" : risk === "medium" ? "Médio" : "Alto"}
    </span>
  );
}

export function PerformanceBadge({ level }: { level: PerformanceLevel }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      level === "star" && "bg-primary/10 text-primary",
      level === "high" && "bg-success/10 text-success",
      level === "medium" && "bg-warning/10 text-warning",
      level === "low" && "bg-danger/10 text-danger",
    )}>
      {level === "star" ? "⭐ Estrela" : level === "high" ? "Alta" : level === "medium" ? "Média" : "Baixa"}
    </span>
  );
}

export function EngagementBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-success" : score >= 65 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground w-8 text-right">{score}%</span>
    </div>
  );
}
