import { useState, useEffect } from "react";
import { kipledDb } from "@/integrations/supabase/kiple-client";
import {
  mockEmployees, mockTeams, engagementTrend,
  turnoverTrend, departmentEngagement, performanceDistribution, mockAlerts
} from "@/lib/mock-data";
import type { Employee, Team, Alert, ChartPoint } from "@/types/kiple";

export type ConnectionStatus = "checking" | "connected" | "no-tables" | "error";

export interface KipleData {
  employees: Employee[];
  teams: Team[];
  engagementTrend: ChartPoint[];
  turnoverTrend: ChartPoint[];
  departmentEngagement: { name: string; value: number; color: string }[];
  performanceDistribution: { name: string; value: number; color: string }[];
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
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Try to fetch employees table
        const { data: empData, error: empError } = await kipledDb
          .from("employees" as any)
          .select("*")
          .limit(200);

        if (cancelled) return;

        if (empError) {
          // Table doesn't exist or no access
          if (empError.code === "42P01" || empError.message?.includes("relation") || empError.message?.includes("does not exist")) {
            setConnectionStatus("no-tables");
          } else {
            setConnectionStatus("error");
          }
          setEmployees([]);
          setTeams([]);
          setLoading(false);
          return;
        }

        // Employees table exists — connection is live
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
          turnoverCost: row.turnover_cost ?? row.custo_turnover ?? 0,
          email: row.email ?? "",
          joinDate: row.join_date ?? row.data_admissao ?? "",
          lastSurvey: row.last_survey ?? row.ultima_pesquisa ?? "",
          careerProgress: row.career_progress ?? row.progressao_carreira ?? 0,
          skillsScore: row.skills_score ?? row.score_habilidades ?? 0,
          avatar: row.avatar,
        }));

        setEmployees(mapped);

        // Try teams table
        const { data: teamsData } = await kipledDb
          .from("teams" as any)
          .select("*")
          .limit(100);

        if (!cancelled) {
          const mappedTeams: Team[] = (teamsData || []).map((row: any, i: number) => ({
            id: row.id ?? i,
            name: row.name ?? row.nome ?? "—",
            department: row.department ?? row.departamento ?? "—",
            lead: row.lead ?? row.lider ?? "—",
            size: row.size ?? row.tamanho ?? 0,
            engagementAvg: row.engagement_avg ?? row.engajamento_medio ?? 0,
            turnoverRate: row.turnover_rate ?? row.taxa_turnover ?? 0,
            performance: mapPerf(row.performance ?? "medium"),
            atRiskCount: row.at_risk_count ?? row.em_risco ?? 0,
          }));
          setTeams(mappedTeams);
          setConnectionStatus("connected");
        }
      } catch (err) {
        if (!cancelled) setConnectionStatus("error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tick]);

  const isUsingMock = connectionStatus !== "connected";
  const finalEmployees = isUsingMock ? mockEmployees : employees;
  const finalTeams = isUsingMock ? mockTeams : teams;

  // Derive chart data from real employees if connected
  const deptEngagement = connectionStatus === "connected" && employees.length > 0
    ? Object.entries(
        employees.reduce((acc: Record<string, number[]>, e) => {
          if (!acc[e.department]) acc[e.department] = [];
          acc[e.department].push(e.engagementScore);
          return acc;
        }, {})
      ).map(([name, scores]) => ({
        name,
        value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        color: DEPT_COLORS[name] ?? "#6366F1",
      }))
    : departmentEngagement;

  const perfDist = connectionStatus === "connected" && employees.length > 0
    ? [
        { name: "Estrelas", value: employees.filter(e => e.performance === "star").length, color: "#2563EB" },
        { name: "Alto", value: employees.filter(e => e.performance === "high").length, color: "#10B981" },
        { name: "Médio", value: employees.filter(e => e.performance === "medium").length, color: "#F59E0B" },
        { name: "Baixo", value: employees.filter(e => e.performance === "low").length, color: "#EF4444" },
      ]
    : performanceDistribution;

  return {
    employees: finalEmployees,
    teams: finalTeams,
    engagementTrend,
    turnoverTrend,
    departmentEngagement: deptEngagement,
    performanceDistribution: perfDist,
    alerts: mockAlerts,
    connectionStatus,
    isUsingMock,
    loading,
    refetch,
  };
}
