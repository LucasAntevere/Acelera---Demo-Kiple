import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_OPTIONS, type MotivoDesligamento, type StatusAtivo } from "@/types/rh";
import { useMotivosDesligamento, type MotivoInput } from "@/hooks/useMotivosDesligamento";
import { Link } from "react-router-dom";

const EMPTY_FORM: MotivoInput = {
  nome: "",
  descricao: "",
  status: "ativo",
};

export default function SettingsPage() {
  const { motivos, criarMotivo, atualizarMotivo } = useMotivosDesligamento();
  const [editing, setEditing] = useState<MotivoDesligamento | null>(null);
  const [form, setForm] = useState<MotivoInput>(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrorMsg(null);
  };

  const openEdit = (m: MotivoDesligamento) => {
    setEditing(m);
    setForm({ nome: m.nome, descricao: m.descricao, status: m.status });
    setErrorMsg(null);
  };

  const save = async () => {
    const result = editing ? await atualizarMotivo(editing.id, form) : await criarMotivo(form);
    if (!result.ok) {
      setErrorMsg(result.message ?? "Erro ao salvar motivo");
      return;
    }
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  return (
    <DashboardLayout title="Configuracoes" subtitle="Preferencias gerais e motivos de desligamento">
      <div className="bg-card border border-border rounded-xl p-5 card-shadow mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Ajustes do sistema</h3>
        <p className="text-xs text-muted-foreground mb-3">
          O foco desta fase e o dominio operacional de RH. Para bootstrap do banco com o novo schema, use a pagina de setup.
        </p>
        <Link to="/setup-banco"><Button size="sm" variant="outline" className="h-8 text-xs">Abrir Setup do Banco</Button></Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 card-shadow mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Motivos de desligamento</h3>
          <Button size="sm" className="h-8 text-xs" onClick={openCreate}>Novo Motivo</Button>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Nome</Label>
          <Input className="mt-1.5" placeholder="Ex.: Pedido do funcionario" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Descricao</Label>
          <Input className="mt-1.5" placeholder="Descreva o motivo" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={form.status} onValueChange={(v: StatusAtivo) => setForm({ ...form, status: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="h-8 text-xs" onClick={() => void save()}>{editing ? "Atualizar" : "Salvar"}</Button>
          {editing && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={openCreate}>Cancelar edicao</Button>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Descricao</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {motivos.map((m, i) => (
                <tr key={m.id} className={i % 2 === 0 ? "" : "bg-muted/5"}>
                  <td className="px-4 py-3 font-medium text-foreground">{m.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.descricao}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.status}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => openEdit(m)}>Editar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
