import { useState, useEffect } from "react";
import { kipledDb } from "@/integrations/supabase/kiple-client";
import {
  mockEmployees, mockTeams, engagementTrend,
  turnoverTrend, departmentEngagement, performanceDistribution, mockAlerts
} from "@/lib/mock-data";
import type { Employee, Team, Alert, ChartPoint } from "@/types/kiple";

export type ConnectionStatus = "checking" | "connected" | "no-tables" | "error";

export interface DeptEngagement { name: string; value: number; color: string; }
export interface PerfDist { name: string; value: number; color: string; }

export interface KipleData {
  employees: Employee[];
  teams: Team[];
  engagementTrend: ChartPoint[];
  turnoverTrend: ChartPoint[];
  departmentEngagement: DeptEngagement[];
  performanceDistribution: PerfDist[];
  alerts: Alert[];
  connectionStatus: ConnectionStatus;
  isUsingMock: boolean;
  loading: boolean;
  refetch: () => void;
}

const DEPT_COLORS: Record<string, string> = {
  Tecnologia: "#2563EB", Produto: "#10B981", Comercial: "#F59E0B",
  RH: "#8B5CF6", Marketing: "#EC4899", Financeiro: "#06B6D4",
};

function mapRisk(val: string): Employee["turnoverRisk"] {
  if (val === "high" || val === "alto") return "high";
  if (val === "medium" || val === "medio" || val === "médio") return "medium";
  return "low";
}

function mapPerf(val: string): Employee["performance"] {
  if (val === "star" || val === "estrela") return "star";
  if (val === "high" || val === "alto") return "high";
  if (val === "low" || val === "baixo") return "low";
  return "medium";
}

export function useKipleData(): KipleData {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [engHistory, setEngHistory] = useState<ChartPoint[]>([]);
  const [turnHistory, setTurnHistory] = useState<ChartPoint[]>([]);
  const [deptColors, setDeptColors] = useState<Record<string, string>>({});
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // ── 1. Try employees (primary health check) ──────────
        const { data: empData, error: empError } = await kipledDb
          .from("employees" as any)
          .select("*")
          .eq("active", true)
          .limit(500);

        if (cancelled) return;

        if (empError) {
          const isNoTable = empError.code === "42P01"
            || empError.message?.includes("relation")
            || empError.message?.includes("does not exist");
          setConnectionStatus(isNoTable ? "no-tables" : "error");
          setLoading(false);
          return;
        }

        // Map employees
        const mapped: Employee[] = (empData || []).map((row: any, i: number) => ({
          id: row.id ?? i,
          name: row.name ?? row.nome ?? "—",
          position: row.position ?? row.cargo ?? "—",
          department: row.department ?? row.departamento ?? "—",
          team: row.team ?? row.equipe ?? "—",
          tenure: row.tenure ?? row.tempo_empresa ?? 0,
          engagementScore: row.engagement_score ?? row.engajamento ?? 0,
          turnoverRisk: mapRisk(row.turnover_risk ?? row.risco_turnover ?? "low"),
          performance: mapPerf(row.performance ?? "medium"),
          turnoverCost: Number(row.turnover_cost ?? row.custo_turnover ?? 0),
          email: row.email ?? "",
          joinDate: row.join_date ?? row.data_admissao ?? "",
          lastSurvey: row.last_survey ?? row.ultima_pesquisa ?? "",
          careerProgress: row.career_progress ?? row.progressao_carreira ?? 0,
          skillsScore: row.skills_score ?? row.score_habilidades ?? 0,
          avatar: row.avatar,
        }));

        if (!cancelled) setEmployees(mapped);

        // ── 2. Teams ─────────────────────────────────────────
        const { data: teamsData } = await kipledDb
          .from("teams" as any)
          .select("*")
          .limit(200);

        if (!cancelled && teamsData) {
          setTeams(teamsData.map((row: any, i: number) => ({
            id: row.id ?? i,
            name: row.name ?? row.nome ?? "—",
            department: row.department ?? row.departamento ?? "—",
            lead: row.lead ?? row.lider ?? "—",
            size: row.size ?? row.tamanho ?? 0,
            engagementAvg: Number(row.engagement_avg ?? row.engajamento_medio ?? 0),
            turnoverRate: Number(row.turnover_rate ?? row.taxa_turnover ?? 0),
            performance: mapPerf(row.performance ?? "medium"),
            atRiskCount: row.at_risk_count ?? row.em_risco ?? 0,
          })));
        }

        // ── 3. Engagement history ─────────────────────────────
        const { data: engData } = await kipledDb
          .from("engagement_history" as any)
          .select("month, value, target")
          .order("year", { ascending: true })
          .order("id", { ascending: true })
          .limit(12);

        if (!cancelled && engData && engData.length > 0) {
          setEngHistory(engData.map((r: any) => ({
            month: r.month,
            value: Number(r.value ?? 0),
            secondary: Number(r.target ?? 0),
          })));
        }

        // ── 4. Turnover history ───────────────────────────────
        const { data: turnData } = await kipledDb
          .from("turnover_history" as any)
          .select("month, rate")
          .order("year", { ascending: true })
          .order("id", { ascending: true })
          .limit(12);

        if (!cancelled && turnData && turnData.length > 0) {
          setTurnHistory(turnData.map((r: any) => ({
            month: r.month,
            value: Number(r.rate ?? 0),
          })));
        }

        // ── 5. Departments (colors) ───────────────────────────
        const { data: deptData } = await kipledDb
          .from("departments" as any)
          .select("name, color");

        if (!cancelled && deptData) {
          const colorMap: Record<string, string> = {};
          deptData.forEach((d: any) => { colorMap[d.name] = d.color ?? "#6366F1"; });
          setDeptColors(colorMap);
        }

        // ── 6. Alerts ─────────────────────────────────────────
        const { data: alertData } = await kipledDb
          .from("alerts" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!cancelled && alertData && alertData.length > 0) {
          setLiveAlerts(alertData.map((r: any) => ({
            id: String(r.id),
            type: r.type as Alert["type"],
            title: r.title,
            message: r.message ?? "",
            timestamp: r.timestamp ?? "agora",
            read: r.read ?? false,
          })));
        }

        if (!cancelled) setConnectionStatus("connected");
      } catch {
        if (!cancelled) setConnectionStatus("error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tick]);

  // Only use mock data when connection actually failed (not during initial checking)
  const shouldUseMock = connectionStatus === "error" || connectionStatus === "no-tables";
  const isUsingMock = shouldUseMock;

  // During checking/loading, show empty arrays. Only use mock if connection failed.
  const finalEmployees = shouldUseMock ? mockEmployees : employees;
  const finalTeams = shouldUseMock ? mockTeams : teams;
  const finalEngHistory = shouldUseMock ? engagementTrend : (engHistory.length === 0 ? [] : engHistory);
  const finalTurnHistory = shouldUseMock ? turnoverTrend : (turnHistory.length === 0 ? [] : turnHistory);
  const finalAlerts = shouldUseMock ? mockAlerts : (liveAlerts.length === 0 ? [] : liveAlerts);

  // Dept engagement from real data
  const finalDeptEngagement = connectionStatus === "connected" && finalEmployees.length > 0
    ? Object.entries(
        finalEmployees.reduce((acc: Record<string, number[]>, e) => {
          if (!acc[e.department]) acc[e.department] = [];
          acc[e.department].push(e.engagementScore);
          return acc;
        }, {})
      ).map(([name, scores]) => ({
        name,
        value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        color: deptColors[name] ?? DEPT_COLORS[name] ?? "#6366F1",
      }))
    : departmentEngagement;

  const finalPerfDist = connectionStatus === "connected" && finalEmployees.length > 0
    ? [
        { name: "Estrelas", value: finalEmployees.filter(e => e.performance === "star").length, color: "#2563EB" },
        { name: "Alto",     value: finalEmployees.filter(e => e.performance === "high").length, color: "#10B981" },
        { name: "Médio",    value: finalEmployees.filter(e => e.performance === "medium").length, color: "#F59E0B" },
        { name: "Baixo",    value: finalEmployees.filter(e => e.performance === "low").length, color: "#EF4444" },
      ]
    : performanceDistribution;

  return {
    employees: finalEmployees,
    teams: finalTeams,
    engagementTrend: finalEngHistory,
    turnoverTrend: finalTurnHistory,
    departmentEngagement: finalDeptEngagement,
    performanceDistribution: finalPerfDist,
    alerts: finalAlerts,
    connectionStatus,
    isUsingMock,
    loading,
    refetch,
  };
}
