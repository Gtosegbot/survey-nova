import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import MySurveys from "./pages/MySurveys";
import ContactImport from "./pages/ContactImport";
import MassDispatcher from "./pages/MassDispatcher";
import Analytics from "./pages/Analytics";
import Credits from "./pages/Credits";
import AICreator from "./pages/AICreator";
import AIResearcher from "./pages/AIResearcher";
import Validation from "./pages/Validation";
import Team from "./pages/Team";
import { SurveyResponse } from "./pages/SurveyResponse";
import { AppLayout } from "./components/layout/AppLayout";
import { CreateSurveyForm } from "./components/sections/CreateSurveyForm";

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
          <Route path="/my-surveys" element={<AppLayout><div className="p-6"><MySurveys /></div></AppLayout>} />
          <Route path="/surveys" element={<AppLayout><div className="p-6"><CreateSurveyForm /></div></AppLayout>} />
          <Route path="/contacts/import" element={<AppLayout><div className="p-6"><ContactImport /></div></AppLayout>} />
          <Route path="/mass-dispatcher" element={<AppLayout><div className="p-6"><MassDispatcher /></div></AppLayout>} />
          <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
          <Route path="/ai-creator" element={<AppLayout><AICreator /></AppLayout>} />
          <Route path="/ai-researcher" element={<AppLayout><AIResearcher /></AppLayout>} />
          <Route path="/credits" element={<AppLayout><Credits /></AppLayout>} />
          <Route path="/validation" element={<AppLayout><Validation /></AppLayout>} />
          <Route path="/team" element={<AppLayout><Team /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><div className="p-6"><h1>Configurações</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          <Route path="/survey/:surveyId" element={<SurveyResponse />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
