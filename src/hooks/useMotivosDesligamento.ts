import { useEffect, useState } from "react";
import { kipledDb } from "@/integrations/supabase/kiple-client";
import type { MotivoDesligamento, StatusAtivo } from "@/types/rh";

export interface MotivoInput {
  nome: string;
  descricao: string;
  status: StatusAtivo;
}

export function useMotivosDesligamento() {
  const [motivos, setMotivos] = useState<MotivoDesligamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);

    const { data, error: dbError } = await kipledDb
      .from("motivos_desligamento" as any)
      .select("*")
      .order("nome", { ascending: true });

    if (dbError) {
      setError(dbError.message);
      setMotivos([]);
    } else {
      setMotivos((data as MotivoDesligamento[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void carregar();
  }, []);

  const criarMotivo = async (payload: MotivoInput) => {
    const { error: dbError } = await kipledDb.from("motivos_desligamento" as any).insert(payload as any);
    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  const atualizarMotivo = async (id: number, payload: MotivoInput) => {
    const { error: dbError } = await kipledDb.from("motivos_desligamento" as any).update(payload as any).eq("id", id);
    if (dbError) return { ok: false, message: dbError.message };
    await carregar();
    return { ok: true };
  };

  return {
    motivos,
    loading,
    error,
    refetch: carregar,
    criarMotivo,
    atualizarMotivo,
  };
}
