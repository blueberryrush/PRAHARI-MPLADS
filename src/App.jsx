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
import { useLanguage } from './contexts/LanguageContext';

import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CalibrationToast from './components/CalibrationToast';

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

    '/citizen': t('nav_citizen'),
    '/citizen/projects': t('nav_projects'),

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
      : location.pathname.startsWith('/official/investigation') || location.pathname.startsWith('/official/investigations')
      ? t('nav_investigation')
      : undefined);

  return (
    <div className="app-layout">

      <Sidebar />

      <div className="app-main">

        <Header title={headerTitle} />
        <CalibrationToast />

        <Routes>

          {/* =========================================
              CITIZEN PORTAL
          ========================================= */}

          <Route
            path="/citizen"
            element={
              <ProtectedRoute>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/citizen/projects"
            element={
              <ProtectedRoute>
                <ProjectExplorer />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              OFFICIAL PORTAL
          ========================================= */}

          {/* Command Centre
              Accessible to every official role */}
          <Route
            path="/official/dashboard"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                  'mp',
                ]}
              >
                <OfficialDashboard />
              </ProtectedRoute>
            }
          />


          {/* Risk Profile & Project Intelligence
              Accessible to authorities and citizens for project transparency */}
          <Route
            path="/official/risk/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                  'mp',
                  'investigator',
                  'citizen',
                ]}
              >
                <RiskProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/project/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'citizen',
                  'ministry',
                  'state_nodal',
                  'district_authority',
                  'mp',
                  'investigator',
                ]}
              >
                <RiskProfile />
              </ProtectedRoute>
            }
          />


          {/* Investigation Centre
              Investigation actions are limited to
              Ministry / State / District authorities and Field Investigators */}
          <Route
            path="/official/investigation"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                  'investigator',
                ]}
              >
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />
          <Route
            path="/official/investigation/:id"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                  'investigator',
                ]}
              >
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />
          <Route
            path="/official/investigations/:id"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                  'investigator',
                ]}
              >
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />
          <Route
            path="/official/investigations"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                  'investigator',
                ]}
              >
                <InvestigationCentre />
              </ProtectedRoute>
            }
          />


          {/* Financial Review */}
          <Route
            path="/official/financial"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                ]}
              >
                <FinancialVerification />
              </ProtectedRoute>
            }
          />


          {/* Duplicate Verification */}
          <Route
            path="/official/duplicate"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                ]}
              >
                <DuplicateVerification />
              </ProtectedRoute>
            }
          />


          {/* Agency Risk */}
          <Route
            path="/official/agency"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                ]}
              >
                <AgencyRiskProfile />
              </ProtectedRoute>
            }
          />


          {/* Comparative Analysis */}
          <Route
            path="/official/comparison"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                ]}
              >
                <ComparisonRiskAnalysis />
              </ProtectedRoute>
            }
          />


          {/* Predictive Bottleneck */}
          <Route
            path="/official/bottleneck"
            element={
              <ProtectedRoute
                requireOfficial
                allowedRoles={[
                  'ministry',
                  'state_nodal',
                  'district_authority',
                ]}
              >
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

      <CaseProvider>

      <LanguageProvider>

        <AuthProvider>

          <AppLayout />

        </AuthProvider>

      </LanguageProvider>

      </CaseProvider>

    </BrowserRouter>
  );
}

export default App;