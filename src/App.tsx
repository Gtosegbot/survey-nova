import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/surveys" element={<AppLayout><div className="p-6"><h1>Pesquisas</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          <Route path="/analytics" element={<AppLayout><div className="p-6"><h1>Analytics</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          <Route path="/ai-creator" element={<AppLayout><div className="p-6"><h1>IA Criadora</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          <Route path="/ai-researcher" element={<AppLayout><div className="p-6"><h1>IA Pesquisadora</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          <Route path="/credits" element={<AppLayout><div className="p-6"><h1>Créditos</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          <Route path="/team" element={<AppLayout><div className="p-6"><h1>Equipe</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          <Route path="/validation" element={<AppLayout><div className="p-6"><h1>Validação</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          <Route path="/settings" element={<AppLayout><div className="p-6"><h1>Configurações</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
