import { useEffect, useState } from "react";
import { kipledDb } from "@/integrations/supabase/kiple-client";
import type { Departamento } from "@/types/rh";

export interface DepartamentoInput {
  nome: string;
}

export function useDepartamentos() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);

    const { data, error: dbError } = await kipledDb
      .from("departamentos" as any)
      .select("*")
      .order("nome", { ascending: true });

    if (dbError) {
      setError(dbError.message);
      setDepartamentos([]);
    } else {
      setDepartamentos((data as Departamento[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void carregar();
  }, []);

  const criarDepartamento = async (payload: DepartamentoInput) => {
    const { error: dbError } = await kipledDb.from("departamentos" as any).insert(payload as any);
    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  const atualizarDepartamento = async (id: number, payload: DepartamentoInput) => {
    const { error: dbError } = await kipledDb.from("departamentos" as any).update(payload as any).eq("id", id);
    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  const removerDepartamento = async (id: number) => {
    const { count, error: countError } = await kipledDb
      .from("funcionarios" as any)
      .select("id", { count: "exact", head: true })
      .eq("departamento_id", id);

    if (countError) return { ok: false, message: countError.message };

    if ((count ?? 0) > 0) {
      return { ok: false, message: "Departamento vinculado a funcionarios. Realoque antes de excluir." };
    }

    const { error: dbError } = await kipledDb.from("departamentos" as any).delete().eq("id", id);
    if (dbError) return { ok: false, message: dbError.message };

    await carregar();
    return { ok: true };
  };

  return {
    departamentos,
    loading,
    error,
    refetch: carregar,
    criarDepartamento,
    atualizarDepartamento,
    removerDepartamento,
  };
}
