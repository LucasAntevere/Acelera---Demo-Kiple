import { BarChart3, BriefcaseMedical, Building2, UserCircle2, FileClock, Settings, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: BarChart3, description: "Visão geral operacional" },
  { title: "Funcionários", url: "/funcionarios", icon: UserCircle2, description: "Cadastro e gestão de funcionários" },
  { title: "Departamentos", url: "/departamentos", icon: Building2, description: "Gestão de departamentos" },
  { title: "Benefícios", url: "/beneficios", icon: BriefcaseMedical, description: "Cadastro e gestão de benefícios" },
  { title: "Desligamentos", url: "/desligamentos", icon: FileClock, description: "Controle de desligamentos" },
];

const bottomItems = [{ title: "Configurações", url: "/configuracoes", icon: Settings, description: "Preferências do sistema" }];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/kiple-logo.png"
            alt="Logotipo do Kiple RH"
            className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
          />
          {!collapsed && (
            <div>
              <span className="text-base font-bold text-sidebar-accent-foreground tracking-tight">Kiple RH</span>
              <p className="text-[10px] text-sidebar-foreground leading-none mt-0.5">Operações de pessoas</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest px-4 mb-1">
              Navegação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      title={`${item.title}: ${item.description}`}
                      aria-label={`${item.title}: ${item.description}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border py-2">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  title={`${item.title}: ${item.description}`}
                  aria-label={`${item.title}: ${item.description}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {!collapsed && (
          <div className="px-3 mt-2 mb-1 space-y-2">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-sidebar-accent" aria-label="Usuário conectado">
              <div className="h-7 w-7 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-sidebar-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{user?.email}</p>
                <p className="text-[10px] text-sidebar-foreground truncate">Usuário</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Encerrar sessão"
              aria-label="Encerrar sessão"
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sair
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
