import { useEffect, useState } from "react";
import { kipledDb } from "@/integrations/supabase/kiple-client";
import type { Funcionario, FuncionarioSexo, StatusAtivo } from "@/types/rh";

export interface FuncionarioInput {
  nome: string;
  data_nascimento: string | null;
  cargo: string;
  departamento_id: number | null;
  sexo: FuncionarioSexo;
  salario: number;
  data_contratacao: string;
  endereco: string;
  status: StatusAtivo;
}

export function useFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await kipledDb
      .from("funcionarios" as any)
      .select("id,nome,data_nascimento,cargo,departamento_id,sexo,salario,data_contratacao,endereco,status,data_criacao,data_atualizacao,departamentos(nome)")
      .order("nome", { ascending: true });

    if (dbError) {
      setError(dbError.message);
      setFuncionarios([]);
    } else {
      const mapped = ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        nome: row.nome,
        data_nascimento: row.data_nascimento,
        cargo: row.cargo,
        departamento_id: row.departamento_id,
        departamento_nome: row.departamentos?.nome ?? null,
        sexo: row.sexo,
        salario: Number(row.salario ?? 0),
        data_contratacao: row.data_contratacao,
        endereco: row.endereco,
        status: row.status,
        data_criacao: row.data_criacao,
        data_atualizacao: row.data_atualizacao,
      })) as Funcionario[];
      setFuncionarios(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    void carregar();
  }, []);

  const criarFuncionario = async (payload: FuncionarioInput) => {
    const { error: dbError } = await kipledDb.from("funcionarios" as any).insert(payload as any);
    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  const atualizarFuncionario = async (id: number, payload: FuncionarioInput) => {
    const { error: dbError } = await kipledDb.from("funcionarios" as any).update(payload as any).eq("id", id);
    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  const atualizarStatus = async (id: number, status: StatusAtivo) => {
    const { error: dbError } = await kipledDb.from("funcionarios" as any).update({ status } as any).eq("id", id);
    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  return {
    funcionarios,
    loading,
    error,
    refetch: carregar,
    criarFuncionario,
    atualizarFuncionario,
    atualizarStatus,
  };
}
