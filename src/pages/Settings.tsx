import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, Building, Users, Palette, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "company", label: "Empresa", icon: <Building className="h-4 w-4" /> },
  { id: "team", label: "Equipe", icon: <Users className="h-4 w-4" /> },
  { id: "notifications", label: "Notificações", icon: <Bell className="h-4 w-4" /> },
  { id: "security", label: "Segurança", icon: <Shield className="h-4 w-4" /> },
  { id: "appearance", label: "Aparência", icon: <Palette className="h-4 w-4" /> },
];

export default function SettingsPage() {
  return (
    <DashboardLayout title="Configurações" subtitle="Preferências e configurações da conta">
      <div className="flex items-start gap-6">
        {/* Sidebar nav */}
        <nav className="hidden md:flex flex-col gap-1 w-44 flex-shrink-0">
          {sections.map((s) => (
            <button
              key={s.id}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                s.id === "company"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Company Info */}
          <div className="bg-card border border-border rounded-xl p-5 card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-4">Informações da Empresa</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nome da Empresa", defaultValue: "TechCorp Brasil", type: "text" },
                { label: "Setor", defaultValue: "Tecnologia", type: "text" },
                { label: "Tamanho da Equipe", defaultValue: "58 funcionários", type: "text" },
                { label: "País", defaultValue: "Brasil", type: "text" },
              ].map((field) => (
                <div key={field.label}>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{field.label}</Label>
                  <Input defaultValue={field.defaultValue} className="h-8 text-sm" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Metas de Engajamento</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Engajamento Mínimo (%)", value: "75" },
                  { label: "Meta de Turnover (%)", value: "10" },
                  { label: "NPS Mínimo", value: "7.5" },
                ].map((goal) => (
                  <div key={goal.label}>
                    <Label className="text-[11px] text-muted-foreground mb-1 block">{goal.label}</Label>
                    <Input defaultValue={goal.value} className="h-8 text-sm" type="number" />
                  </div>
                ))}
              </div>
            </div>
            <Button size="sm" className="h-8 text-xs mt-4 gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Salvar Alterações
            </Button>
          </div>

          {/* Notifications */}
          <div className="bg-card border border-border rounded-xl p-5 card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-4">Notificações</h3>
            <div className="space-y-3">
              {[
                { label: "Alertas de turnover em tempo real", description: "Quando um funcionário atinge risco alto", on: true },
                { label: "Relatórios mensais automáticos", description: "Enviados no primeiro dia de cada mês", on: true },
                { label: "Resumo semanal por email", description: "Resumo de KPIs toda segunda-feira", on: false },
                { label: "Alertas de engajamento crítico", description: "Quando equipes caem abaixo da meta", on: true },
                { label: "Novas respostas de pesquisa", description: "Notificação ao receber novas respostas", on: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked={item.on} />
                </div>
              ))}
            </div>
          </div>

          {/* Survey settings */}
          <div className="bg-card border border-border rounded-xl p-5 card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-4">Pesquisas de Engajamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Frequência das Pesquisas</Label>
                <Select defaultValue="monthly">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Idioma das Pesquisas</Label>
                <Select defaultValue="pt-br">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-br">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button size="sm" className="h-8 text-xs mt-4 gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
