import { useEffect, useState } from "react";
import { kipledDb } from "@/integrations/supabase/kiple-client";
import type { Beneficio, BeneficioTipo, FuncionarioBeneficio, StatusAtivo } from "@/types/rh";

export interface BeneficioInput {
  nome: string;
  tipo: BeneficioTipo;
  descricao: string;
  valor: number;
  status: StatusAtivo;
}

export interface VinculoBeneficioInput {
  funcionario_id: number;
  beneficio_id: number;
  data_inicio: string;
  data_fim?: string | null;
}

export function useBeneficios() {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);

    const { data, error: dbError } = await kipledDb
      .from("beneficios" as any)
      .select("*")
      .order("nome", { ascending: true });

    if (dbError) {
      setError(dbError.message);
      setBeneficios([]);
    } else {
      setBeneficios((data as Beneficio[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void carregar();
  }, []);

  const criarBeneficio = async (payload: BeneficioInput) => {
    const { error: dbError } = await kipledDb.from("beneficios" as any).insert(payload as any);
    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  const atualizarBeneficio = async (id: number, payload: BeneficioInput) => {
    const { error: dbError } = await kipledDb.from("beneficios" as any).update(payload as any).eq("id", id);
    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  const removerBeneficio = async (id: number) => {
    const { count, error: countError } = await kipledDb
      .from("funcionario_beneficios" as any)
      .select("id", { count: "exact", head: true })
      .eq("beneficio_id", id);

    if (countError) {
      return { ok: false, message: countError.message };
    }

    if ((count ?? 0) > 0) {
      return { ok: false, message: "Benefício possui vínculos. Inative em vez de excluir." };
    }

    const { error: dbError } = await kipledDb.from("beneficios" as any).delete().eq("id", id);
    if (dbError) return { ok: false, message: dbError.message };

    await carregar();
    return { ok: true };
  };

  const listarVinculosFuncionario = async (funcionarioId: number): Promise<FuncionarioBeneficio[]> => {
    const { data } = await kipledDb
      .from("funcionario_beneficios" as any)
      .select("id, funcionario_id, beneficio_id, data_inicio, data_fim, data_criacao, beneficios(id,nome,tipo,valor,status)")
      .eq("funcionario_id", funcionarioId)
      .order("data_inicio", { ascending: false });

    return ((data ?? []) as any[]).map((row) => ({
      id: row.id,
      funcionario_id: row.funcionario_id,
      beneficio_id: row.beneficio_id,
      data_inicio: row.data_inicio,
      data_fim: row.data_fim,
      data_criacao: row.data_criacao,
      beneficio: row.beneficios,
    }));
  };

  const criarVinculo = async (payload: VinculoBeneficioInput) => {
    const { error: dbError } = await kipledDb.from("funcionario_beneficios" as any).insert({
      ...payload,
      data_fim: payload.data_fim ?? null,
    } as any);

    if (dbError) return { ok: false, message: dbError.message };
    return { ok: true };
  };

  const encerrarVinculo = async (id: number, data_fim: string) => {
    const { error: dbError } = await kipledDb
      .from("funcionario_beneficios" as any)
      .update({ data_fim } as any)
      .eq("id", id);

    if (dbError) return { ok: false, message: dbError.message };
    return { ok: true };
  };

  return {
    beneficios,
    loading,
    error,
    refetch: carregar,
    criarBeneficio,
    atualizarBeneficio,
    removerBeneficio,
    listarVinculosFuncionario,
    criarVinculo,
    encerrarVinculo,
  };
}

