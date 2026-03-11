import { Bell, Search, SlidersHorizontal } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const rhAlerts = [
  { id: "1", title: "Cadastro pendente", message: "2 funcionários sem endereço completo.", read: false },
  { id: "2", title: "Benefício para revisar", message: "1 benefício inativo ainda com solicitações.", read: false },
  { id: "3", title: "Desligamentos do mês", message: "Confira os desligamentos previstos para esta semana.", read: true },
];

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const unreadCount = rhAlerts.filter((a) => !a.read).length;

  return (
    <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 gap-4 sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
          title="Abrir ou recolher menu lateral"
          aria-label="Abrir ou recolher menu lateral"
        />
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            placeholder="Buscar funcionários, benefícios, desligamentos..."
            aria-label="Busca global da aplicação"
            title="Busca global por funcionários, benefícios e desligamentos"
            className="pl-8 h-8 w-72 text-xs bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 hidden sm:flex"
          title="Abrir filtros rápidos"
          aria-label="Abrir filtros rápidos"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Filtros
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              title="Abrir alertas de RH"
              aria-label={`Abrir alertas de RH. ${unreadCount} não lidos.`}
            >
              <Bell className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-danger text-danger-foreground text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 dropdown-shadow">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-semibold">Alertas RH</p>
              <p className="text-xs text-muted-foreground">{unreadCount} não lidos</p>
            </div>
            {rhAlerts.map((alert) => (
              <DropdownMenuItem key={alert.id} className="flex items-start gap-2.5 py-2.5 px-3 cursor-pointer">
                <div className={cn("mt-1 h-2 w-2 rounded-full flex-shrink-0", alert.read ? "bg-muted-foreground" : "bg-primary")} />
                <div className="min-w-0">
                  <p className={cn("text-xs font-medium", alert.read ? "text-muted-foreground" : "text-foreground")}>{alert.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
