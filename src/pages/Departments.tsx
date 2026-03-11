import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { useDepartamentos, type DepartamentoInput } from "@/hooks/useDepartamentos";
import type { Departamento } from "@/types/rh";

const EMPTY_FORM: DepartamentoInput = {
  nome: "",
};

export default function DepartmentsPage() {
  const { departamentos, loading, criarDepartamento, atualizarDepartamento, removerDepartamento } = useDepartamentos();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Departamento | null>(null);
  const [form, setForm] = useState<DepartamentoInput>(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return departamentos.filter((d) => d.nome.toLowerCase().includes(search.toLowerCase()));
  }, [departamentos, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrorMsg(null);
    setFormOpen(true);
  };

  const openEdit = (d: Departamento) => {
    setEditing(d);
    setForm({ nome: d.nome });
    setErrorMsg(null);
    setFormOpen(true);
  };

  const save = async () => {
    const payload = { nome: form.nome.trim() };

    if (!payload.nome) {
      setErrorMsg("Nome do departamento e obrigatorio.");
      return;
    }

    const result = editing
      ? await atualizarDepartamento(editing.id, payload)
      : await criarDepartamento(payload);

    if (!result.ok) {
      setErrorMsg(result.message ?? "Erro ao salvar departamento");
      return;
    }

    setFormOpen(false);
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  return (
    <DashboardLayout title="Departamentos" subtitle="Gestao de departamentos organizacionais">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Departamentos
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{departamentos.length} departamentos cadastrados</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Novo Departamento
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4">
        <Label htmlFor="departamento-search" className="text-xs text-muted-foreground">Buscar departamento</Label>
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="departamento-search"
            placeholder="Digite o nome do departamento"
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {formOpen && (
        <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{editing ? "Editar Departamento" : "Novo Departamento"}</h3>

          <div>
            <Label className="text-xs text-muted-foreground">Nome do departamento</Label>
            <Input
              className="mt-1.5"
              placeholder="Ex.: Recursos Humanos"
              value={form.nome}
              onChange={(e) => setForm({ nome: e.target.value })}
            />
          </div>

          {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-8 text-xs" onClick={() => void save()}>Salvar</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setFormOpen(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Criado em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? "" : "bg-muted/5"}>
                  <td className="px-4 py-3 font-medium text-foreground">{d.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(d.data_criacao).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => openEdit(d)}>
                        <PencilLine className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={async () => {
                          const result = await removerDepartamento(d.id);
                          if (!result.ok) setErrorMsg(result.message ?? "Erro ao excluir departamento");
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {errorMsg && <p className="text-xs text-danger mt-2">{errorMsg}</p>}
    </DashboardLayout>
  );
}
