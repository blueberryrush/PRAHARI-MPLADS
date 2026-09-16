import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';

import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CaseProvider } from './contexts/CaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';

import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CalibrationToast from './components/CalibrationToast';
import AIChatbot from './components/common/AIChatbot';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ProjectExplorer from './pages/citizen/ProjectExplorer';

import OfficialDashboard from './pages/official/OfficialDashboard';
import FinancialVerification from './pages/official/FinancialVerification';
import DuplicateVerification from './pages/official/DuplicateVerification';
import AgencyRiskProfile from './pages/official/AgencyRiskProfile';
import ComparisonRiskAnalysis from './pages/official/ComparisonRiskAnalysis';
import PredictiveBottleneck from './pages/official/PredictiveBottleneck';
import RiskProfile from './pages/official/RiskProfile';
import InvestigationCentre from './pages/official/InvestigationCentre';


function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isPublicRoute = ['/', '/login', '/signup'].includes(
    location.pathname
  );

  /* ---------------------------------------------
     PUBLIC ROUTES
  --------------------------------------------- */

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    );
  }

  /* ---------------------------------------------
     PAGE TITLES
  --------------------------------------------- */

  const titles = {
    '/official/risk': t('nav_risk'),
    '/official/investigation': t('nav_investigation'),
    '/official/investigations': t('nav_investigation'),
    '/investigation': t('nav_investigation'),
    '/investigations': t('nav_investigation'),

    '/citizen': t('nav_citizen'),
    '/citizen/projects': t('nav_projects'),

    '/dashboard': t('nav_dashboard'),
    '/command': t('nav_dashboard'),
    '/official/dashboard': t('nav_dashboard'),
    '/official/financial': t('nav_financial'),
    '/official/duplicate': t('nav_duplicate'),
    '/official/agency': t('nav_agency'),
    '/official/comparison': t('nav_comparison'),
    '/official/bottleneck': t('nav_bottleneck'),
  };

  /*
    Risk Profile and Investigation Centre have dynamic :id.
    Resolve the localized title reactively.
  */
  const headerTitle =
    titles[location.pathname] ||
    (location.pathname.startsWith('/official/risk') || location.pathname.startsWith('/citizen/project')
      ? t('nav_risk')
      : location.pathname.startsWith('/official/investigation') ||
        location.pathname.startsWith('/official/investigations') ||
        location.pathname.startsWith('/investigation') ||
        location.pathname.startsWith('/investigations') ||
        location.pathname.startsWith('/cases')
      ? t('nav_investigation')
      : location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/command')
      ? t('nav_dashboard')
      : undefined);

  return (
    <div className="app-layout">

      <Sidebar />

      <div className="app-main">

        <Header title={headerTitle} />
        <CalibrationToast />

        <Routes>

          {/* =========================================
              CITIZEN PORTAL (Protected Login Gate)
          ========================================= */}

          <Route
            path="/citizen"
            element={
              <ProtectedRoute requireAuth={true} redirectTo="/?auth=citizen">
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/citizen/projects"
            element={
              <ProtectedRoute requireAuth={true} redirectTo="/?auth=citizen">
                <ProjectExplorer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/citizen/project/:id"
            element={
              <ProtectedRoute requireAuth={true} redirectTo="/?auth=citizen">
                <RiskProfile />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              COMMAND CENTRE / OFFICIAL PORTAL
          ========================================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireOfficial allowedPortal="COMMAND_CENTER" redirectTo="/?auth=command">
                <OfficialDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/command"
            element={
              <ProtectedRoute requireOfficial allowedPortal="COMMAND_CENTER" redirectTo="/?auth=command">
                <OfficialDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/official/dashboard"
            element={
              <ProtectedRoute requireOfficial allowedPortal="COMMAND_CENTER" redirectTo="/?auth=command">
                <OfficialDashboard />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              INVESTIGATION CENTRE / CASE DESK
          ========================================= */}

          <Route
            path="/investigation"
            element={
              <ProtectedRoute requireOfficial allowedPortal="INVESTIGATION_CENTER" redirectTo="/?auth=investigation">
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/investigation/:id"
            element={
              <ProtectedRoute requireOfficial allowedPortal="INVESTIGATION_CENTER" redirectTo="/?auth=investigation">
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/investigations"
            element={
              <ProtectedRoute requireOfficial allowedPortal="INVESTIGATION_CENTER" redirectTo="/?auth=investigation">
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/investigations/:id"
            element={
              <ProtectedRoute requireOfficial allowedPortal="INVESTIGATION_CENTER" redirectTo="/?auth=investigation">
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cases/:id"
            element={
              <ProtectedRoute requireOfficial allowedPortal="INVESTIGATION_CENTER" redirectTo="/?auth=investigation">
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/official/investigation"
            element={
              <ProtectedRoute requireOfficial allowedPortal="INVESTIGATION_CENTER" redirectTo="/?auth=investigation">
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/official/investigation/:id"
            element={
              <ProtectedRoute requireOfficial allowedPortal="INVESTIGATION_CENTER" redirectTo="/?auth=investigation">
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/official/investigations"
            element={
              <ProtectedRoute requireOfficial allowedPortal="INVESTIGATION_CENTER" redirectTo="/?auth=investigation">
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/official/investigations/:id"
            element={
              <ProtectedRoute requireOfficial allowedPortal="INVESTIGATION_CENTER" redirectTo="/?auth=investigation">
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              OFFICIAL RISK & ANALYTICS MODULES
          ========================================= */}

          {/* Risk Profile & Project Intelligence */}
          <Route
            path="/official/risk/:id"
            element={
              <ProtectedRoute requireOfficial>
                <RiskProfile />
              </ProtectedRoute>
            }
          />

          {/* Financial Review */}
          <Route
            path="/official/financial"
            element={
              <ProtectedRoute requireOfficial allowedPortal="COMMAND_CENTER">
                <FinancialVerification />
              </ProtectedRoute>
            }
          />

          {/* Duplicate Verification */}
          <Route
            path="/official/duplicate"
            element={
              <ProtectedRoute requireOfficial allowedPortal="COMMAND_CENTER">
                <DuplicateVerification />
              </ProtectedRoute>
            }
          />

          {/* Agency Risk */}
          <Route
            path="/official/agency"
            element={
              <ProtectedRoute requireOfficial allowedPortal="COMMAND_CENTER">
                <AgencyRiskProfile />
              </ProtectedRoute>
            }
          />

          {/* Comparative Analysis */}
          <Route
            path="/official/comparison"
            element={
              <ProtectedRoute requireOfficial allowedPortal="COMMAND_CENTER">
                <ComparisonRiskAnalysis />
              </ProtectedRoute>
            }
          />

          {/* Predictive Bottleneck */}
          <Route
            path="/official/bottleneck"
            element={
              <ProtectedRoute requireOfficial allowedPortal="COMMAND_CENTER">
                <PredictiveBottleneck />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              FALLBACK
          ========================================= */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>

      </div>

    </div>
  );
}


/* =============================================
   ROOT APP
============================================= */

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <CaseProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppLayout />
              <AIChatbot />
            </AuthProvider>
          </LanguageProvider>
        </CaseProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;