import { useEffect, useState } from "react";
import { kipledDb } from "@/integrations/supabase/kiple-client";
import type { Desligamento, TipoDesligamento } from "@/types/rh";

export interface DesligamentoInput {
  funcionario_id: number;
  data_pedido: string;
  data_prevista_saida?: string | null;
  data_efetiva_saida?: string | null;
  motivo_desligamento_id: number;
  observacoes?: string | null;
  responsavel_registro: string;
  tipo_desligamento: TipoDesligamento;
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
    funcionario_cargo: row.funcionarios?.cargo ?? null,
    funcionario_departamento_nome: row.funcionarios?.departamentos?.nome ?? null,
    motivo_nome: row.motivos_desligamento?.nome,
  };
}

export function useDesligamentos() {
  const [desligamentos, setDesligamentos] = useState<Desligamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);

    const { data, error: dbError } = await kipledDb
      .from("desligamentos" as any)
      .select("*, funcionarios(nome,cargo,departamentos(nome)), motivos_desligamento(nome)")
      .order("data_pedido", { ascending: false });

    if (dbError) {
      setError(dbError.message);
      setDesligamentos([]);
    } else {
      setDesligamentos(((data ?? []) as any[]).map(mapDesligamento));
    }

    setLoading(false);
  };

  useEffect(() => {
    void carregar();
  }, []);

  const listarPorFuncionario = async (funcionarioId: number) => {
    const { data } = await kipledDb
      .from("desligamentos" as any)
      .select("*, funcionarios(nome,cargo,departamentos(nome)), motivos_desligamento(nome)")
      .eq("funcionario_id", funcionarioId)
      .order("data_pedido", { ascending: false });

    return ((data ?? []) as any[]).map(mapDesligamento);
  };

  const criarDesligamento = async (payload: DesligamentoInput) => {
    const { error: dbError } = await kipledDb.from("desligamentos" as any).insert({
      ...payload,
      data_prevista_saida: payload.data_prevista_saida ?? null,
      data_efetiva_saida: payload.data_efetiva_saida ?? null,
      observacoes: payload.observacoes ?? null,
    } as any);

    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  const atualizarDesligamento = async (id: number, payload: DesligamentoInput) => {
    const { error: dbError } = await kipledDb
      .from("desligamentos" as any)
      .update({
        ...payload,
        data_prevista_saida: payload.data_prevista_saida ?? null,
        data_efetiva_saida: payload.data_efetiva_saida ?? null,
        observacoes: payload.observacoes ?? null,
      } as any)
      .eq("id", id);

    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  return {
    desligamentos,
    loading,
    error,
    refetch: carregar,
    listarPorFuncionario,
    criarDesligamento,
    atualizarDesligamento,
  };
}
