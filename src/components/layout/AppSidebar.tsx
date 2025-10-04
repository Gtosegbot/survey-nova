import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  FileText,
  TrendingUp,
  CreditCard,
  Settings,
  Users,
  MessageSquare,
  Brain,
  Shield,
  Search,
  Send
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import tepesquiseiLogo from "@/assets/tepesquisei-logo.png";

const navigationItems = [
  {
    group: "Principal",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
      { title: "Minhas Pesquisas", url: "/surveys", icon: FileText },
      { title: "Criar Pesquisa", url: "/surveys", icon: Search },
      { title: "Analytics", url: "/analytics", icon: TrendingUp },
    ]
  },
  {
    group: "IA Assistente",
    items: [
      { title: "Criar com IA", url: "/ai-creator", icon: Brain },
      { title: "IA Pesquisadora", url: "/ai-researcher", icon: MessageSquare },
    ]
  },
  {
    group: "Gestão",
    items: [
      { title: "Créditos", url: "/credits", icon: CreditCard },
      { title: "Importar Contatos", url: "/contacts/import", icon: Users },
      { title: "Disparadores", url: "/dispatchers", icon: Send },
      { title: "Validação", url: "/validation", icon: Shield },
    ]
  },
  {
    group: "Conta",
    items: [
      { title: "Configurações", url: "/settings", icon: Settings },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 transition-colors";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent className="border-r bg-card">
        {/* Logo Section */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={tepesquiseiLogo} 
                alt="Te Pesquisei" 
                className="h-8 w-8"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Te Pesquisei
                </span>
                <span className="text-xs text-muted-foreground">
                  Pesquisas Inteligentes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        {navigationItems.map((group) => (
          <SidebarGroup key={group.group}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
                {group.group}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={({ isActive }) => `
                          flex items-center gap-3 px-3 py-2 rounded-md transition-all
                          ${getNavCls({ isActive })}
                          ${collapsed ? 'justify-center' : ''}
                        `}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}