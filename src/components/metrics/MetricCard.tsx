import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
    label?: string;
    positiveIsUp?: boolean; // if false, down is positive (e.g. turnover)
  };
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "danger";
  target?: string;
  className?: string;
}

const colorMap = {
  primary: {
    icon: "bg-primary/10 text-primary",
    badge: "bg-primary/10 text-primary",
  },
  success: {
    icon: "bg-success/10 text-success",
    badge: "bg-success/10 text-success",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    badge: "bg-warning/10 text-warning",
  },
  danger: {
    icon: "bg-danger/10 text-danger",
    badge: "bg-danger/10 text-danger",
  },
};

export function MetricCard({ title, value, unit, trend, icon, color, target, className }: MetricCardProps) {
  const colors = colorMap[color];

  const isGoodTrend =
    trend &&
    ((trend.positiveIsUp !== false && trend.direction === "up") ||
      (trend.positiveIsUp === false && trend.direction === "down"));

  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;

  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 card-shadow hover:card-shadow-hover transition-shadow animate-slide-in", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", colors.icon)}>
          {icon}
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            isGoodTrend ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}>
            <TrendIcon className="h-3 w-3" />
            {trend.value}
          </div>
        )}
      </div>

      <div className="mt-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {unit && <span className="text-sm text-muted-foreground font-medium">{unit}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
      </div>

      {target && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground">{target}</p>
        </div>
      )}

      {trend?.label && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground">{trend.label}</p>
        </div>
      )}
    </div>
  );
}
