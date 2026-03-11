import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search } from "lucide-react";
import { useDesligamentos, type DesligamentoInput } from "@/hooks/useDesligamentos";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useMotivosDesligamento } from "@/hooks/useMotivosDesligamento";
import { TIPO_DESLIGAMENTO_OPTIONS, type Desligamento, type TipoDesligamento } from "@/types/rh";

const EMPTY_FORM: DesligamentoInput = {
  funcionario_id: 0,
  data_pedido: new Date().toISOString().slice(0, 10),
  data_prevista_saida: null,
  data_efetiva_saida: null,
  motivo_desligamento_id: 0,
  observacoes: "",
  responsavel_registro: "",
  tipo_desligamento: "voluntario",
};

function dt(v?: string | null) {
  if (!v) return "-";
  return new Date(`${v}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function TerminationsPage() {
  const { desligamentos, loading, criarDesligamento, atualizarDesligamento } = useDesligamentos();
  const { funcionarios } = useFuncionarios();
  const { motivos } = useMotivosDesligamento();

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"all" | TipoDesligamento>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Desligamento | null>(null);
  const [form, setForm] = useState<DesligamentoInput>(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return desligamentos.filter((d) => {
      const byName = (d.funcionario_nome ?? "").toLowerCase().includes(search.toLowerCase());
      const byTipo = tipoFilter === "all" || d.tipo_desligamento === tipoFilter;
      return byName && byTipo;
    });
  }, [desligamentos, search, tipoFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
    setErrorMsg(null);
  };

  const openEdit = (d: Desligamento) => {
    setEditing(d);
    setForm({
      funcionario_id: d.funcionario_id,
      data_pedido: d.data_pedido,
      data_prevista_saida: d.data_prevista_saida,
      data_efetiva_saida: d.data_efetiva_saida,
      motivo_desligamento_id: d.motivo_desligamento_id,
      observacoes: d.observacoes ?? "",
      responsavel_registro: d.responsavel_registro,
      tipo_desligamento: d.tipo_desligamento,
    });
    setFormOpen(true);
    setErrorMsg(null);
  };

  const save = async () => {
    const result = editing ? await atualizarDesligamento(editing.id, form) : await criarDesligamento(form);
    if (!result.ok) {
      setErrorMsg(result.message ?? "Erro ao salvar desligamento");
      return;
    }
    setFormOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <DashboardLayout title="Desligamentos" subtitle="Gestao completa do processo de desligamento">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Desligamentos
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{desligamentos.length} registros</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Novo Desligamento</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Buscar por funcionario</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Digite o nome" className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Filtrar por tipo de desligamento</Label>
          <Select value={tipoFilter} onValueChange={(v: any) => setTipoFilter(v)}>
            <SelectTrigger className="h-9 text-sm mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {TIPO_DESLIGAMENTO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formOpen && (
        <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{editing ? "Editar Desligamento" : "Novo Desligamento"}</h3>

          <div>
            <Label className="text-xs text-muted-foreground">Funcionario</Label>
            <Select value={String(form.funcionario_id || 0)} onValueChange={(v) => setForm({ ...form, funcionario_id: Number(v) })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione o funcionario" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Selecione o funcionario</SelectItem>
                {funcionarios.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Motivo de desligamento</Label>
            <Select value={String(form.motivo_desligamento_id || 0)} onValueChange={(v) => setForm({ ...form, motivo_desligamento_id: Number(v) })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Selecione o motivo</SelectItem>
                {motivos.filter((m) => m.status === "ativo").map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Tipo de desligamento</Label>
            <Select value={form.tipo_desligamento} onValueChange={(v: any) => setForm({ ...form, tipo_desligamento: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{TIPO_DESLIGAMENTO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Data do pedido</Label>
              <Input className="mt-1.5" type="date" value={form.data_pedido} onChange={(e) => setForm({ ...form, data_pedido: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data prevista de saida</Label>
              <Input className="mt-1.5" type="date" value={form.data_prevista_saida ?? ""} onChange={(e) => setForm({ ...form, data_prevista_saida: e.target.value || null })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data efetiva de saida</Label>
              <Input className="mt-1.5" type="date" value={form.data_efetiva_saida ?? ""} onChange={(e) => setForm({ ...form, data_efetiva_saida: e.target.value || null })} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Responsavel pelo registro</Label>
            <Input className="mt-1.5" placeholder="Ex.: RH Operacoes" value={form.responsavel_registro} onChange={(e) => setForm({ ...form, responsavel_registro: e.target.value })} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Observacoes</Label>
            <Input className="mt-1.5" placeholder="Contexto adicional" value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
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
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Funcionario</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Motivo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Pedido</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Prevista</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Efetiva</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const status = d.data_efetiva_saida ? "concluido" : "pendente";
                return (
                  <tr key={d.id} className={i % 2 === 0 ? "" : "bg-muted/5"}>
                    <td className="px-4 py-3 font-medium text-foreground">{d.funcionario_nome ?? `Funcionario #${d.funcionario_id}`}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.motivo_nome ?? `Motivo #${d.motivo_desligamento_id}`}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.tipo_desligamento}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dt(d.data_pedido)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dt(d.data_prevista_saida)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dt(d.data_efetiva_saida)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded ${status === "concluido" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => openEdit(d)}>Editar</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
