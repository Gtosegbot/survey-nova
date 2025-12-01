import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { NotificationListener } from "./components/NotificationListener";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Surveys from "./pages/Surveys";
import MySurveys from "./pages/MySurveys";
import ContactImport from "./pages/ContactImport";
import MassDispatcher from "./pages/MassDispatcher";
import Analytics from "./pages/Analytics";
import Credits from "./pages/Credits";
import AICreator from "./pages/AICreator";
import AIResearcher from "./pages/AIResearcher";
import TrendingSurveys from "./pages/TrendingSurveys";
import Validation from "./pages/Validation";
import Team from "./pages/Team";
import Dispatchers from "./pages/Dispatchers";
import Settings from "./pages/Settings";
import Referrals from "./pages/Referrals";
import CreateSurvey from "./pages/CreateSurvey";
import { SurveyResponse } from "./pages/SurveyResponse";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <NotificationListener />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/survey/:surveyId" element={<SurveyResponse />} />
            <Route path="/research/:researcherId" element={<AIResearcher />} />
            <Route path="/trending" element={<TrendingSurveys />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/surveys" element={<ProtectedRoute><AppLayout><Surveys /></AppLayout></ProtectedRoute>} />
            <Route path="/my-surveys" element={<ProtectedRoute><AppLayout><MySurveys /></AppLayout></ProtectedRoute>} />
            <Route path="/contacts/import" element={<ProtectedRoute><AppLayout><div className="p-6"><ContactImport /></div></AppLayout></ProtectedRoute>} />
            <Route path="/mass-dispatcher" element={<ProtectedRoute><AppLayout><div className="p-6"><MassDispatcher /></div></AppLayout></ProtectedRoute>} />
            <Route path="/dispatchers" element={<ProtectedRoute><AppLayout><div className="p-6"><Dispatchers /></div></AppLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
            <Route path="/ai-creator" element={<ProtectedRoute><AppLayout><AICreator /></AppLayout></ProtectedRoute>} />
            <Route path="/create-survey" element={<ProtectedRoute><AppLayout><CreateSurvey /></AppLayout></ProtectedRoute>} />
            <Route path="/credits" element={<ProtectedRoute><AppLayout><Credits /></AppLayout></ProtectedRoute>} />
            <Route path="/validation" element={<ProtectedRoute><AppLayout><Validation /></AppLayout></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><AppLayout><Team /></AppLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppLayout><div className="p-6"><Settings /></div></AppLayout></ProtectedRoute>} />
            <Route path="/referrals" element={<ProtectedRoute><AppLayout><Referrals /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
