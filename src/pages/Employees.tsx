import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search, PencilLine } from "lucide-react";
import { useFuncionarios, type FuncionarioInput } from "@/hooks/useFuncionarios";
import { useDepartamentos } from "@/hooks/useDepartamentos";
import { useBeneficios } from "@/hooks/useBeneficios";
import { useDesligamentos } from "@/hooks/useDesligamentos";
import {
  SEXO_OPTIONS,
  STATUS_OPTIONS,
  type Funcionario,
  type FuncionarioBeneficio,
  type Desligamento,
} from "@/types/rh";
import { currencyInputToNumber, formatCurrencyFromNumber, formatCurrencyInput } from "@/lib/currency";

const EMPTY_FORM: FuncionarioInput = {
  nome: "",
  data_nascimento: "",
  cargo: "",
  departamento_id: null,
  sexo: "nao_informado",
  salario: 0,
  data_contratacao: new Date().toISOString().slice(0, 10),
  endereco: "",
  status: "ativo",
};

function dt(v?: string | null) {
  if (!v) return "-";
  return new Date(`${v}T00:00:00`).toLocaleDateString("pt-BR");
}

function calcAge(dataNascimento?: string | null) {
  if (!dataNascimento) return "-";
  const birth = new Date(`${dataNascimento}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "-";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return String(age);
}

export default function EmployeesPage() {
  const { funcionarios, loading, criarFuncionario, atualizarFuncionario, atualizarStatus } = useFuncionarios();
  const { departamentos } = useDepartamentos();
  const { beneficios, listarVinculosFuncionario, criarVinculo, encerrarVinculo } = useBeneficios();
  const { listarPorFuncionario } = useDesligamentos();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ativo" | "inativo">("all");
  const [sortBy, setSortBy] = useState<"nome" | "data_contratacao">("nome");
  const [selected, setSelected] = useState<Funcionario | null>(null);
  const [editing, setEditing] = useState<Funcionario | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState<FuncionarioInput>(EMPTY_FORM);
  const [salarioInput, setSalarioInput] = useState(formatCurrencyFromNumber(0));
  const [vinculos, setVinculos] = useState<FuncionarioBeneficio[]>([]);
  const [desligamentos, setDesligamentos] = useState<Desligamento[]>([]);
  const [novoVinculo, setNovoVinculo] = useState({ beneficio_id: 0, data_inicio: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    if (!selected) return;
    void (async () => {
      setVinculos(await listarVinculosFuncionario(selected.id));
      setDesligamentos(await listarPorFuncionario(selected.id));
    })();
  }, [selected, listarPorFuncionario, listarVinculosFuncionario]);

  const filtered = useMemo(() => {
    let rows = funcionarios.filter((f) => {
      const q = search.toLowerCase();
      return (
        f.nome.toLowerCase().includes(q) ||
        (f.cargo ?? "").toLowerCase().includes(q) ||
        (f.departamento_nome ?? "").toLowerCase().includes(q)
      );
    });

    if (statusFilter !== "all") rows = rows.filter((f) => f.status === statusFilter);

    rows = [...rows].sort((a, b) => {
      if (sortBy === "nome") return a.nome.localeCompare(b.nome);
      return (b.data_contratacao ?? "").localeCompare(a.data_contratacao ?? "");
    });

    return rows;
  }, [funcionarios, search, statusFilter, sortBy]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSalarioInput(formatCurrencyFromNumber(0));
    setFormOpen(true);
  };

  const openEdit = (f: Funcionario) => {
    setEditing(f);
    setForm({
      nome: f.nome,
      data_nascimento: f.data_nascimento ?? "",
      cargo: f.cargo ?? "",
      departamento_id: f.departamento_id ?? null,
      sexo: f.sexo,
      salario: f.salario,
      data_contratacao: f.data_contratacao,
      endereco: f.endereco,
      status: f.status,
    });
    setSalarioInput(formatCurrencyFromNumber(f.salario));
    setFormOpen(true);
  };

  const saveFuncionario = async () => {
    setSaving(true);
    setErrorMsg(null);

    const payload: FuncionarioInput = {
      ...form,
      data_nascimento: form.data_nascimento || null,
      cargo: form.cargo.trim(),
      salario: currencyInputToNumber(salarioInput),
    };

    if (!payload.data_nascimento) {
      setSaving(false);
      setErrorMsg("Data de nascimento é obrigatória.");
      return;
    }

    if (!payload.cargo) {
      setSaving(false);
      setErrorMsg("Cargo é obrigatório.");
      return;
    }

    const result = editing ? await atualizarFuncionario(editing.id, payload) : await criarFuncionario(payload);
    setSaving(false);

    if (!result.ok) {
      setErrorMsg(result.message ?? "Erro ao salvar funcionário");
      return;
    }

    setFormOpen(false);
    setForm(EMPTY_FORM);
    setSalarioInput(formatCurrencyFromNumber(0));
  };

  const vincularBeneficio = async () => {
    if (!selected || !novoVinculo.beneficio_id) return;

    const result = await criarVinculo({
      funcionario_id: selected.id,
      beneficio_id: novoVinculo.beneficio_id,
      data_inicio: novoVinculo.data_inicio,
      data_fim: null,
    });

    if (result.ok) {
      setVinculos(await listarVinculosFuncionario(selected.id));
      setNovoVinculo({ beneficio_id: 0, data_inicio: new Date().toISOString().slice(0, 10) });
    } else {
      setErrorMsg(result.message ?? "Erro ao vincular benefício");
    }
  };

  return (
    <DashboardLayout title="Funcionários" subtitle="Cadastro e acompanhamento operacional">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Funcionários
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Carregando funcionários" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{funcionarios.length} registros</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate} title="Cadastrar novo funcionário" aria-label="Cadastrar novo funcionário">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Novo Funcionário
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-3">
        <div>
          <Label htmlFor="func-search" className="text-xs text-muted-foreground">Buscar funcionário</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input id="func-search" placeholder="Digite nome, cargo ou departamento" className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} title="Busca por nome, cargo ou departamento" aria-label="Busca por nome, cargo ou departamento" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Filtrar por status</Label>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="h-9 text-sm mt-1.5" aria-label="Filtro por status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Ordenação</Label>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="h-9 text-sm mt-1.5" aria-label="Ordenação da listagem"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nome">Ordenar por nome</SelectItem>
                <SelectItem value="data_contratacao">Ordenar por contratação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{editing ? "Editar Funcionário" : "Novo Funcionário"}</h3>

          <div>
            <Label htmlFor="func-nome" className="text-xs text-muted-foreground">Nome</Label>
            <Input id="func-nome" className="mt-1.5" placeholder="Nome completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} title="Nome completo do funcionário" />
          </div>

          <div>
            <Label htmlFor="func-cargo" className="text-xs text-muted-foreground">Cargo</Label>
            <Input id="func-cargo" className="mt-1.5" placeholder="Ex.: Analista de RH" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} title="Cargo atual do funcionário" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Departamento</Label>
            <Select
              value={form.departamento_id !== null ? String(form.departamento_id) : "none"}
              onValueChange={(v) => setForm({ ...form, departamento_id: v === "none" ? null : Number(v) })}
            >
              <SelectTrigger className="mt-1.5" aria-label="Selecionar departamento"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem departamento</SelectItem>
                {departamentos.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="func-endereco" className="text-xs text-muted-foreground">Endereço</Label>
            <Input id="func-endereco" className="mt-1.5" placeholder="Cidade, estado e complemento" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} title="Endereço do funcionário" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="func-nascimento" className="text-xs text-muted-foreground">Data de nascimento</Label>
              <Input id="func-nascimento" className="mt-1.5" type="date" value={form.data_nascimento ?? ""} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} title="Data de nascimento do funcionário" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sexo</Label>
              <Select value={form.sexo} onValueChange={(v: any) => setForm({ ...form, sexo: v })}>
                <SelectTrigger className="mt-1.5" aria-label="Sexo"><SelectValue /></SelectTrigger>
                <SelectContent>{SEXO_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="func-salario" className="text-xs text-muted-foreground">Salário</Label>
              <Input
                id="func-salario"
                className="mt-1.5"
                inputMode="numeric"
                value={salarioInput}
                title="Salário em reais"
                aria-label="Salário em reais"
                onChange={(e) => {
                  const masked = formatCurrencyInput(e.target.value);
                  setSalarioInput(masked);
                  setForm((prev) => ({ ...prev, salario: currencyInputToNumber(masked) }));
                }}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1.5" aria-label="Status do funcionário"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="func-contratacao" className="text-xs text-muted-foreground">Data de contratação</Label>
            <Input id="func-contratacao" className="mt-1.5" type="date" value={form.data_contratacao} onChange={(e) => setForm({ ...form, data_contratacao: e.target.value })} title="Data de admissão do funcionário" />
          </div>

          {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-8 text-xs" onClick={saveFuncionario} disabled={saving} title="Salvar funcionário">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setFormOpen(false)} title="Cancelar edição">Cancelar</Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="Tabela de funcionários">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Cargo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Departamento</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nascimento</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Idade</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Sexo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Salário</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Contratação</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id} className={i % 2 === 0 ? "" : "bg-muted/5"}>
                  <td className="px-4 py-3 font-medium text-foreground">{f.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.cargo ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.departamento_nome ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dt(f.data_nascimento)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{calcAge(f.data_nascimento)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.sexo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatCurrencyFromNumber(f.salario)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dt(f.data_contratacao)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void atualizarStatus(f.id, f.status === "ativo" ? "inativo" : "ativo")}
                      title={`Alterar status de ${f.nome}`}
                      aria-label={`Alterar status de ${f.nome}`}
                      className={`text-[11px] px-2 py-0.5 rounded ${f.status === "ativo" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
                    >
                      {f.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setSelected(f)} title={`Ver detalhes de ${f.nome}`}>Detalhes</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => openEdit(f)} title={`Editar ${f.nome}`}>
                        <PencilLine className="h-3 w-3 mr-1" aria-hidden="true" /> Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="bg-card border border-border rounded-xl p-4 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Detalhes de {selected.nome}</h3>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(null)} title="Fechar painel de detalhes">Fechar</Button>
          </div>

          <div className="mb-3 text-xs text-muted-foreground">
            <p>Cargo: <span className="text-foreground font-medium">{selected.cargo ?? "-"}</span></p>
            <p>Departamento: <span className="text-foreground font-medium">{selected.departamento_nome ?? "-"}</span></p>
            <p>Nascimento: <span className="text-foreground font-medium">{dt(selected.data_nascimento)}</span> • Idade: <span className="text-foreground font-medium">{calcAge(selected.data_nascimento)}</span></p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-3">
              <h4 className="text-xs font-semibold text-foreground mb-3">Benefícios vinculados</h4>
              <div className="space-y-2 mb-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Benefício</Label>
                  <Select value={String(novoVinculo.beneficio_id || "0")} onValueChange={(v) => setNovoVinculo((prev) => ({ ...prev, beneficio_id: Number(v) }))}>
                    <SelectTrigger className="h-8 text-xs mt-1.5" aria-label="Selecionar benefício para vínculo"><SelectValue placeholder="Selecione um benefício" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Selecione um benefício</SelectItem>
                      {beneficios.filter((b) => b.status === "ativo").map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <Label htmlFor="vinculo-data-inicio" className="text-xs text-muted-foreground">Data de início</Label>
                    <Input id="vinculo-data-inicio" type="date" className="h-8 text-xs mt-1.5" value={novoVinculo.data_inicio} onChange={(e) => setNovoVinculo((prev) => ({ ...prev, data_inicio: e.target.value }))} title="Data inicial do vínculo do benefício" />
                  </div>
                  <Button size="sm" className="h-8 text-xs" onClick={() => void vincularBeneficio()} title="Vincular benefício ao funcionário">Vincular</Button>
                </div>
              </div>
              <div className="space-y-2">
                {vinculos.length === 0 && <p className="text-xs text-muted-foreground">Sem benefícios vinculados.</p>}
                {vinculos.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs border border-border rounded px-2 py-1.5">
                    <div>
                      <p className="font-medium text-foreground">{v.beneficio?.nome ?? `Benefício #${v.beneficio_id}`}</p>
                      <p className="text-muted-foreground">Início: {dt(v.data_inicio)} • Fim: {dt(v.data_fim)}</p>
                    </div>
                    {!v.data_fim && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        title="Encerrar vínculo do benefício"
                        onClick={async () => {
                          const today = new Date().toISOString().slice(0, 10);
                          const result = await encerrarVinculo(v.id, today);
                          if (result.ok && selected) setVinculos(await listarVinculosFuncionario(selected.id));
                        }}
                      >
                        Encerrar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border rounded-lg p-3">
              <h4 className="text-xs font-semibold text-foreground mb-2">Histórico de desligamentos</h4>
              <div className="space-y-2">
                {desligamentos.length === 0 && <p className="text-xs text-muted-foreground">Nenhum desligamento para este funcionário.</p>}
                {desligamentos.map((d) => (
                  <div key={d.id} className="text-xs border border-border rounded px-2 py-1.5">
                    <p className="font-medium text-foreground">{d.motivo_nome ?? `Motivo #${d.motivo_desligamento_id}`}</p>
                    <p className="text-muted-foreground">Pedido: {dt(d.data_pedido)} • Prevista: {dt(d.data_prevista_saida)} • Efetiva: {dt(d.data_efetiva_saida)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
