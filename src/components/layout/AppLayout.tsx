import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, roles, isAdmin, signOut } = useAuth();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="p-2" />
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Gerencie suas pesquisas inteligentes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.display_name || profile?.email}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    {isAdmin() && (
                      <Badge variant="default" className="mt-1">
                        <Shield className="h-3 w-3 mr-1" />
                        Administrador
                      </Badge>
                    )}
                    {roles.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {roles.map(role => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        
        {/* Floating Chat Button */}
        <FloatingChatButton />
      </div>
    </SidebarProvider>
  );
}
