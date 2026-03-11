import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/Employees";
import BenefitsPage from "./pages/Benefits";
import DepartmentsPage from "./pages/Departments";
import TerminationsPage from "./pages/Terminations";
import SettingsPage from "./pages/Settings";
import DatabaseSetupPage from "./pages/DatabaseSetup";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/funcionarios" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
            <Route path="/beneficios" element={<ProtectedRoute><BenefitsPage /></ProtectedRoute>} />
            <Route path="/departamentos" element={<ProtectedRoute><DepartmentsPage /></ProtectedRoute>} />
            <Route path="/desligamentos" element={<ProtectedRoute><TerminationsPage /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/setup-banco" element={<ProtectedRoute><DatabaseSetupPage /></ProtectedRoute>} />
            <Route path="/equipes" element={<Navigate to="/departamentos" replace />} />
            <Route path="/relatorios" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
