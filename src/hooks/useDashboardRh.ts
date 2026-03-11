import { useEffect, useState } from "react";
import { kipledDb } from "@/integrations/supabase/kiple-client";
import type { DashboardRhData, Desligamento, Funcionario } from "@/types/rh";

const EMPTY_DATA: DashboardRhData = {
  totalFuncionarios: 0,
  funcionariosAtivos: 0,
  funcionariosInativos: 0,
  beneficiosAtivos: 0,
  vinculosAtivos: 0,
  desligamentosPeriodo: 0,
  proximosDesligamentos: [],
  ultimosDesligamentos: [],
  contratacoesRecentes: [],
};

function startOfMonthISO() {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  return start.toISOString().slice(0, 10);
}

function mapDesligamento(row: any): Desligamento {
  return {
    id: row.id,
    funcionario_id: row.funcionario_id,
    data_pedido: row.data_pedido,
    data_prevista_saida: row.data_prevista_saida,
    data_efetiva_saida: row.data_efetiva_saida,
    motivo_desligamento_id: row.motivo_desligamento_id,
    observacoes: row.observacoes,
    responsavel_registro: row.responsavel_registro,
    tipo_desligamento: row.tipo_desligamento,
    data_criacao: row.data_criacao,
    data_atualizacao: row.data_atualizacao,
    funcionario_nome: row.funcionarios?.nome,
    motivo_nome: row.motivos_desligamento?.nome,
  };
}

export function useDashboardRh() {
  const [data, setData] = useState<DashboardRhData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        totalRes,
        ativosRes,
        inativosRes,
        beneficiosRes,
        vinculosRes,
        desligamentosMesRes,
        proximosRes,
        ultimosRes,
        contratacoesRes,
      ] = await Promise.all([
        kipledDb.from("funcionarios" as any).select("id", { count: "exact", head: true }),
        kipledDb.from("funcionarios" as any).select("id", { count: "exact", head: true }).eq("status", "ativo"),
        kipledDb.from("funcionarios" as any).select("id", { count: "exact", head: true }).eq("status", "inativo"),
        kipledDb.from("beneficios" as any).select("id", { count: "exact", head: true }).eq("status", "ativo"),
        kipledDb.from("funcionario_beneficios" as any).select("id", { count: "exact", head: true }).is("data_fim", null),
        kipledDb.from("desligamentos" as any).select("id", { count: "exact", head: true }).gte("data_pedido", startOfMonthISO()),
        kipledDb
          .from("desligamentos" as any)
          .select("*, funcionarios(nome), motivos_desligamento(nome)")
          .is("data_efetiva_saida", null)
          .not("data_prevista_saida", "is", null)
          .order("data_prevista_saida", { ascending: true })
          .limit(5),
        kipledDb
          .from("desligamentos" as any)
          .select("*, funcionarios(nome), motivos_desligamento(nome)")
          .order("data_pedido", { ascending: false })
          .limit(5),
        kipledDb
          .from("funcionarios" as any)
          .select("*")
          .order("data_contratacao", { ascending: false })
          .limit(5),
      ]);

      setData({
        totalFuncionarios: totalRes.count ?? 0,
        funcionariosAtivos: ativosRes.count ?? 0,
        funcionariosInativos: inativosRes.count ?? 0,
        beneficiosAtivos: beneficiosRes.count ?? 0,
        vinculosAtivos: vinculosRes.count ?? 0,
        desligamentosPeriodo: desligamentosMesRes.count ?? 0,
        proximosDesligamentos: ((proximosRes.data ?? []) as any[]).map(mapDesligamento),
        ultimosDesligamentos: ((ultimosRes.data ?? []) as any[]).map(mapDesligamento),
        contratacoesRecentes: (contratacoesRes.data ?? []) as Funcionario[],
      });
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar dashboard");
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: carregar,
  };
}
