import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useBeneficios, type BeneficioInput } from "@/hooks/useBeneficios";
import { BENEFICIO_TIPO_OPTIONS, STATUS_OPTIONS, type Beneficio, type BeneficioTipo, type StatusAtivo } from "@/types/rh";
import { currencyInputToNumber, formatCurrencyFromNumber, formatCurrencyInput } from "@/lib/currency";

const EMPTY_FORM: BeneficioInput = {
  nome: "",
  tipo: "saude",
  descricao: "",
  valor: 0,
  status: "ativo",
};

export default function BenefitsPage() {
  const { beneficios, loading, criarBeneficio, atualizarBeneficio, removerBeneficio } = useBeneficios();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"all" | BeneficioTipo>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusAtivo>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Beneficio | null>(null);
  const [form, setForm] = useState<BeneficioInput>(EMPTY_FORM);
  const [valorInput, setValorInput] = useState(formatCurrencyFromNumber(0));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return beneficios.filter((b) => {
      const hit = b.nome.toLowerCase().includes(search.toLowerCase());
      const tipoOk = tipoFilter === "all" || b.tipo === tipoFilter;
      const statusOk = statusFilter === "all" || b.status === statusFilter;
      return hit && tipoOk && statusOk;
    });
  }, [beneficios, search, tipoFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setValorInput(formatCurrencyFromNumber(0));
    setErrorMsg(null);
    setFormOpen(true);
  };

  const openEdit = (b: Beneficio) => {
    setEditing(b);
    setForm({ nome: b.nome, tipo: b.tipo, descricao: b.descricao, valor: b.valor, status: b.status });
    setValorInput(formatCurrencyFromNumber(b.valor));
    setErrorMsg(null);
    setFormOpen(true);
  };

  const save = async () => {
    const payload = { ...form, valor: currencyInputToNumber(valorInput) };
    const result = editing ? await atualizarBeneficio(editing.id, payload) : await criarBeneficio(payload);
    if (!result.ok) {
      setErrorMsg(result.message ?? "Erro ao salvar");
      return;
    }
    setFormOpen(false);
    setForm(EMPTY_FORM);
    setValorInput(formatCurrencyFromNumber(0));
  };

  return (
    <DashboardLayout title="Beneficios" subtitle="Cadastro e manutencao de beneficios">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Beneficios
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{beneficios.length} beneficios cadastrados</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Novo Beneficio</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-3">
        <div>
          <Label htmlFor="beneficio-search" className="text-xs text-muted-foreground">Buscar beneficio</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="beneficio-search" placeholder="Digite o nome" className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Filtrar por tipo</Label>
            <Select value={tipoFilter} onValueChange={(v: any) => setTipoFilter(v)}>
              <SelectTrigger className="h-9 text-sm mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {BENEFICIO_TIPO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Filtrar por status</Label>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="h-9 text-sm mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="bg-card border border-border rounded-xl p-4 card-shadow mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{editing ? "Editar Beneficio" : "Novo Beneficio"}</h3>

          <div>
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input className="mt-1.5" placeholder="Ex.: Plano de Saude" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Descricao</Label>
            <Input className="mt-1.5" placeholder="Descreva o beneficio" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v: any) => setForm({ ...form, tipo: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{BENEFICIO_TIPO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Valor</Label>
            <Input
              className="mt-1.5"
              inputMode="numeric"
              value={valorInput}
              onChange={(e) => {
                const masked = formatCurrencyInput(e.target.value);
                setValorInput(masked);
                setForm((prev) => ({ ...prev, valor: currencyInputToNumber(masked) }));
              }}
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
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} className={i % 2 === 0 ? "" : "bg-muted/5"}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{b.nome}</p>
                    <p className="text-muted-foreground">{b.descricao}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.tipo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatCurrencyFromNumber(b.valor)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded ${b.status === "ativo" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => openEdit(b)}>Editar</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={async () => {
                          const result = await removerBeneficio(b.id);
                          if (!result.ok) setErrorMsg(result.message ?? "Erro ao excluir");
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
