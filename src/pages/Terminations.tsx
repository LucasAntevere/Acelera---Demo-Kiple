import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, Plus, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useDesligamentos, type DesligamentoInput } from "@/hooks/useDesligamentos";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useMotivosDesligamento } from "@/hooks/useMotivosDesligamento";
import { TIPO_DESLIGAMENTO_OPTIONS, type Desligamento, type TipoDesligamento } from "@/types/rh";

const CHART_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"];

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

function reportDate(d: Desligamento) {
  return d.data_efetiva_saida || d.data_prevista_saida || d.data_pedido;
}

function normalizeFilterValue(v?: string | null) {
  const parsed = (v ?? "").trim();
  return parsed.length > 0 ? parsed : "Não informado";
}

function csvCell(value: string | null | undefined) {
  const safeValue = (value ?? "").replace(/"/g, '""');
  return `"${safeValue}"`;
}

function toggleArrayValue(current: string[], value: string) {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
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

  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [cargosSelecionados, setCargosSelecionados] = useState<string[]>([]);
  const [departamentosSelecionados, setDepartamentosSelecionados] = useState<string[]>([]);
  const periodoInvalido = !!dataInicial && !!dataFinal && dataInicial > dataFinal;

  const filtered = useMemo(() => {
    return desligamentos.filter((d) => {
      const byName = (d.funcionario_nome ?? "").toLowerCase().includes(search.toLowerCase());
      const byTipo = tipoFilter === "all" || d.tipo_desligamento === tipoFilter;
      return byName && byTipo;
    });
  }, [desligamentos, search, tipoFilter]);

  const cargoOptions = useMemo(() => {
    return Array.from(new Set(desligamentos.map((d) => normalizeFilterValue(d.funcionario_cargo)))).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [desligamentos]);

  const departamentoOptions = useMemo(() => {
    return Array.from(new Set(desligamentos.map((d) => normalizeFilterValue(d.funcionario_departamento_nome)))).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [desligamentos]);

  const reportFiltered = useMemo(() => {
    if (periodoInvalido) return [];
    return filtered.filter((d) => {
      const dateValue = reportDate(d);
      const byDateFrom = !dataInicial || dateValue >= dataInicial;
      const byDateTo = !dataFinal || dateValue <= dataFinal;
      const cargoValue = normalizeFilterValue(d.funcionario_cargo);
      const byCargo = cargosSelecionados.length === 0 || cargosSelecionados.includes(cargoValue);
      const departamentoValue = normalizeFilterValue(d.funcionario_departamento_nome);
      const byDepartamento =
        departamentosSelecionados.length === 0 || departamentosSelecionados.includes(departamentoValue);
      return byDateFrom && byDateTo && byCargo && byDepartamento;
    });
  }, [filtered, dataInicial, dataFinal, cargosSelecionados, departamentosSelecionados, periodoInvalido]);

  const totalConcluidos = useMemo(() => reportFiltered.filter((d) => !!d.data_efetiva_saida).length, [reportFiltered]);
  const totalPendentes = reportFiltered.length - totalConcluidos;
  const totaisPorTipo = useMemo(() => {
    return TIPO_DESLIGAMENTO_OPTIONS.map((tipo) => ({
      tipo,
      total: reportFiltered.filter((d) => d.tipo_desligamento === tipo).length,
    })).filter((item) => item.total > 0);
  }, [reportFiltered]);

  const totalAtivos = useMemo(() => funcionarios.filter((f) => f.status === "ativo").length, [funcionarios]);

  const taxaRotatividade = useMemo(() => {
    if (totalAtivos === 0) return null;
    return ((reportFiltered.length / totalAtivos) * 100).toFixed(1);
  }, [reportFiltered.length, totalAtivos]);

  const tendenciaMensal = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of reportFiltered) {
      const date = reportDate(d);
      if (!date) continue;
      const key = date.slice(0, 7);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => {
        const [year, month] = mes.split("-");
        const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        return { mes: label, total };
      });
  }, [reportFiltered]);

  const totalPorDepartamento = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of reportFiltered) {
      const dep = normalizeFilterValue(d.funcionario_departamento_nome);
      counts[dep] = (counts[dep] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([departamento, total]) => ({ departamento, total }));
  }, [reportFiltered]);

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

  const exportarCsv = () => {
    const header = [
      "Funcionario",
      "Cargo",
      "Departamento",
      "Motivo",
      "Tipo",
      "Data pedido",
      "Data prevista",
      "Data efetiva",
      "Status",
      "Responsavel",
      "Observacoes",
    ];

    const rows = reportFiltered.map((d) => [
      d.funcionario_nome ?? `Funcionário #${d.funcionario_id}`,
      normalizeFilterValue(d.funcionario_cargo),
      normalizeFilterValue(d.funcionario_departamento_nome),
      d.motivo_nome ?? `Motivo #${d.motivo_desligamento_id}`,
      d.tipo_desligamento,
      d.data_pedido,
      d.data_prevista_saida ?? "",
      d.data_efetiva_saida ?? "",
      d.data_efetiva_saida ? "concluído" : "pendente",
      d.responsavel_registro,
      d.observacoes ?? "",
    ]);

    const csv = [header, ...rows].map((line) => line.map((cell) => csvCell(cell)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `relatorio-desligamentos-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportarPdf = () => {
    window.print();
  };

  return (
    <DashboardLayout title="Desligamentos" subtitle="Gestão completa do processo de desligamento">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Desligamentos
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Carregando desligamentos" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {reportFiltered.length} registros filtrados de {desligamentos.length} no total
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate} title="Registrar novo desligamento" aria-label="Registrar novo desligamento"><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Novo Desligamento</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-3">
        <div>
          <Label htmlFor="desligamento-search" className="text-xs text-muted-foreground">Buscar por funcionário</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input id="desligamento-search" placeholder="Digite o nome" className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} title="Busca por nome do funcionário" aria-label="Busca por nome do funcionário" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Filtrar por tipo de desligamento</Label>
          <Select value={tipoFilter} onValueChange={(v: any) => setTipoFilter(v)}>
            <SelectTrigger className="h-9 text-sm mt-1.5" aria-label="Filtro por tipo de desligamento"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {TIPO_DESLIGAMENTO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Relatório de desligamentos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Filtros por datas, cargos e departamentos com exportação CSV.</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={exportarCsv}
              disabled={reportFiltered.length === 0}
              title="Exportar relatório em CSV"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Exportar CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={exportarPdf}
              disabled={reportFiltered.length === 0}
              title="Exportar relatório em PDF"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="report-data-inicial" className="text-xs text-muted-foreground">Data inicial</Label>
            <Input
              id="report-data-inicial"
              className="mt-1.5"
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              title="Filtrar por data inicial"
            />
          </div>
          <div>
            <Label htmlFor="report-data-final" className="text-xs text-muted-foreground">Data final</Label>
            <Input
              id="report-data-final"
              className="mt-1.5"
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              title="Filtrar por data final"
            />
          </div>
        </div>
        {periodoInvalido && (
          <p className="text-xs text-danger">
            O intervalo de datas está inválido. A data inicial deve ser menor ou igual à data final.
          </p>
        )}

        <div>
          <Label className="text-xs text-muted-foreground">Cargos (múltipla seleção)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {cargoOptions.map((cargo) => {
              const active = cargosSelecionados.includes(cargo);
              return (
                <button
                  key={cargo}
                  type="button"
                  onClick={() => setCargosSelecionados((prev) => toggleArrayValue(prev, cargo))}
                  className={`px-2 py-1 rounded text-[11px] border transition ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {cargo}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Departamentos (múltipla seleção)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {departamentoOptions.map((departamento) => {
              const active = departamentosSelecionados.includes(departamento);
              return (
                <button
                  key={departamento}
                  type="button"
                  onClick={() => setDepartamentosSelecionados((prev) => toggleArrayValue(prev, departamento))}
                  className={`px-2 py-1 rounded text-[11px] border transition ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {departamento}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground">Total de desligamentos</p>
            <p className="text-xl font-bold text-foreground">{reportFiltered.length}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground">Concluídos</p>
            <p className="text-xl font-bold text-success">{totalConcluidos}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground">Pendentes</p>
            <p className="text-xl font-bold text-warning">{totalPendentes}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground">Taxa de rotatividade</p>
            <p className="text-xl font-bold text-foreground">
              {taxaRotatividade !== null ? `${taxaRotatividade}%` : "—"}
            </p>
            {totalAtivos > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{totalAtivos} ativos</p>
            )}
          </div>
        </div>

        {totaisPorTipo.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Totais por tipo</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {totaisPorTipo.map((item) => (
                <div key={item.tipo} className="rounded border border-border px-2 py-1.5">
                  <p className="text-[11px] text-muted-foreground truncate">{item.tipo}</p>
                  <p className="text-sm font-semibold text-foreground">{item.total}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tendenciaMensal.length > 1 && (
          <div>
            <Label className="text-xs text-muted-foreground">Tendência mensal</Label>
            <div className="mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendenciaMensal} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="total" name="Desligamentos" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {totaisPorTipo.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Distribuição por tipo</Label>
              <div className="mt-2 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={totaisPorTipo} dataKey="total" nameKey="tipo" cx="50%" cy="50%" outerRadius={70} label={({ tipo, percent }) => `${tipo} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                      {totaisPorTipo.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 11, background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {totalPorDepartamento.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Desligamentos por departamento</Label>
              <div className="mt-2 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={totalPorDepartamento} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis type="category" dataKey="departamento" width={90} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                    />
                    <Bar dataKey="total" name="Total" fill="#10b981" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{editing ? "Editar Desligamento" : "Novo Desligamento"}</h3>

          <div>
            <Label className="text-xs text-muted-foreground">Funcionário</Label>
            <Select value={String(form.funcionario_id || 0)} onValueChange={(v) => setForm({ ...form, funcionario_id: Number(v) })}>
              <SelectTrigger className="mt-1.5" aria-label="Selecionar funcionário"><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Selecione o funcionário</SelectItem>
                {funcionarios.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Motivo de desligamento</Label>
            <Select value={String(form.motivo_desligamento_id || 0)} onValueChange={(v) => setForm({ ...form, motivo_desligamento_id: Number(v) })}>
              <SelectTrigger className="mt-1.5" aria-label="Selecionar motivo de desligamento"><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Selecione o motivo</SelectItem>
                {motivos.filter((m) => m.status === "ativo").map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Tipo de desligamento</Label>
            <Select value={form.tipo_desligamento} onValueChange={(v: any) => setForm({ ...form, tipo_desligamento: v })}>
              <SelectTrigger className="mt-1.5" aria-label="Tipo de desligamento"><SelectValue /></SelectTrigger>
              <SelectContent>{TIPO_DESLIGAMENTO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="data-pedido" className="text-xs text-muted-foreground">Data do pedido</Label>
              <Input id="data-pedido" className="mt-1.5" type="date" value={form.data_pedido} onChange={(e) => setForm({ ...form, data_pedido: e.target.value })} title="Data em que o desligamento foi solicitado" />
            </div>
            <div>
              <Label htmlFor="data-prevista" className="text-xs text-muted-foreground">Data prevista de saída</Label>
              <Input id="data-prevista" className="mt-1.5" type="date" value={form.data_prevista_saida ?? ""} onChange={(e) => setForm({ ...form, data_prevista_saida: e.target.value || null })} title="Data planejada para saída" />
            </div>
            <div>
              <Label htmlFor="data-efetiva" className="text-xs text-muted-foreground">Data efetiva de saída</Label>
              <Input id="data-efetiva" className="mt-1.5" type="date" value={form.data_efetiva_saida ?? ""} onChange={(e) => setForm({ ...form, data_efetiva_saida: e.target.value || null })} title="Data real de saída" />
            </div>
          </div>

          <div>
            <Label htmlFor="responsavel-registro" className="text-xs text-muted-foreground">Responsável pelo registro</Label>
            <Input id="responsavel-registro" className="mt-1.5" placeholder="Ex.: RH Operações" value={form.responsavel_registro} onChange={(e) => setForm({ ...form, responsavel_registro: e.target.value })} title="Nome de quem registrou o desligamento" />
          </div>

          <div>
            <Label htmlFor="observacoes" className="text-xs text-muted-foreground">Observações</Label>
            <Input id="observacoes" className="mt-1.5" placeholder="Contexto adicional" value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} title="Observações adicionais do desligamento" />
          </div>

          {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-8 text-xs" onClick={() => void save()} title="Salvar desligamento">Salvar</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setFormOpen(false)} title="Cancelar edição">Cancelar</Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="Tabela de desligamentos">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Funcionário</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Motivo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Cargo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Departamento</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Pedido</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Prevista</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Efetiva</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reportFiltered.map((d, i) => {
                const status = d.data_efetiva_saida ? "concluído" : "pendente";
                return (
                  <tr key={d.id} className={i % 2 === 0 ? "" : "bg-muted/5"}>
                    <td className="px-4 py-3 font-medium text-foreground">{d.funcionario_nome ?? `Funcionário #${d.funcionario_id}`}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.motivo_nome ?? `Motivo #${d.motivo_desligamento_id}`}</td>
                    <td className="px-4 py-3 text-muted-foreground">{normalizeFilterValue(d.funcionario_cargo)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{normalizeFilterValue(d.funcionario_departamento_nome)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.tipo_desligamento}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dt(d.data_pedido)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dt(d.data_prevista_saida)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dt(d.data_efetiva_saida)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded ${status === "concluído" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => openEdit(d)} title="Editar desligamento">Editar</Button>
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
