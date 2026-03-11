export type TurnoverRisk = "low" | "medium" | "high";
export type PerformanceLevel = "low" | "medium" | "high" | "star";

export interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  team: string;
  tenure: number; // months
  engagementScore: number; // 0-100
  turnoverRisk: TurnoverRisk;
  performance: PerformanceLevel;
  turnoverCost: number;
  avatar?: string;
  email: string;
  joinDate: string;
  lastSurvey: string;
  careerProgress: number; // 0-100
  skillsScore: number; // 0-100
}

export interface Team {
  id: number;
  name: string;
  department: string;
  lead: string;
  size: number;
  engagementAvg: number;
  turnoverRate: number;
  performance: PerformanceLevel;
  atRiskCount: number;
}

export interface MetricSummary {
  current: number;
  previous: number;
  trend: "up" | "down" | "neutral";
  target: number;
  unit?: string;
}

export interface ChartPoint {
  month: string;
  value: number;
  secondary?: number;
}

export interface Alert {
  id: string;
  type: "warning" | "info" | "danger" | "success";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
