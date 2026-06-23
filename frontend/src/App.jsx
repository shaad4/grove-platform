import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, GuestRoute, SetupRoute } from './routes/ProtectedRoute'
import TenantRoute from './routes/TenantRoute'
import TenantGuard from './routes/TenantGuard'
import ErrorBoundary from './ErrorBoundary'
import { useAuth } from './context/AuthContext'

// Admin routes (fully isolated — see routes/AdminProtectedRoute.jsx)
import { AdminProtectedRoute, AdminGuestRoute } from './routes/AdminProtectedRoute'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminTenantsPage from './pages/admin/AdminTenantsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminPlansPage from './pages/admin/AdminPlansPage'

// Auth pages
import LandingPage        from './pages/LandingPage'
import SignupPage         from './pages/SignupPage'
import VerifyEmailPage    from './pages/VerifyEmailPage'
import WorkspaceSetupPage from './pages/WorkspaceSetupPage'
import LoginPage          from './pages/LoginPage'
import PortalsPage        from './pages/PortalsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import WorkspaceNotFoundPage from './pages/WorkspaceNotFoundPage'

// Client pages
import AcceptInvitePage   from './pages/client/AcceptInvitePage'
import ClientLoginPage    from './pages/client/ClientLoginPage'
import ClientDashboard    from './pages/client/ClientDashboard'
import ClientRequestsPage from './pages/client/ClientRequestsPage'
import ClientRequestDetailPage  from './pages/client/ClientRequestDetailPage'


// Provider pages
import ProviderDashboard  from './pages/provider/ProviderDashboard'
import ClientsPage        from './pages/provider/ClientsPage'
import ClientDetailPage   from './pages/provider/ClientDetailPage'
import RequestsPage       from './pages/provider/RequestsPage'
import RequestDetailPage  from './pages/provider/RequestDetailPage'
import ActivityPage       from './pages/provider/ActivityPage'
import UpgradePage        from './pages/provider/UpgradePage'
import { BadgeProvider } from './context/BadgeContext'
import UpgradeModal from './components/modals/UpgradeModal'
import UpgradeSuccessModal from './components/modals/UpgradeSuccessModal'
import AdminBootstrap from './context/AdminBootstrap'


function RoleDashboard() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user?.role === 'provider') return <ProviderDashboard />
  if (user?.role === 'client')   return <ClientDashboard />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>

        {/* Grove Admin */}
        <Routes>
          <Route path="/grove-admin/*" element={
            <AdminBootstrap>
              <Routes>
                <Route element={<AdminGuestRoute />}>
                  <Route path="login" element={<AdminLoginPage />} />
                </Route>
                <Route element={<AdminProtectedRoute />}>
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="tenants" element={<AdminTenantsPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="plans" element={<AdminPlansPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/grove-admin/login" replace />} />
              </Routes>
            </AdminBootstrap>
          } />

          {/* ── Everything else — the existing tenant/provider/client app ── */}
          <Route path="/*" element={
            <AuthProvider>
              <TenantGuard>
                <Routes>

                  {/* Public */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Pre-auth — no session needed */}
                  <Route path="/accept-invite" element={<AcceptInvitePage />} />
                  <Route path="/client-login"  element={<ClientLoginPage />} />

                  {/* Guest only */}
                  <Route element={<GuestRoute />}>
                    <Route path="/signup"          element={<SignupPage />} />
                    <Route path="/login"           element={<LoginPage />} />
                    <Route path="/verify-email"    element={<VerifyEmailPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password"  element={<ResetPasswordPage />} />
                  </Route>

                  {/* Portal picker (root domain, authenticated) — BadgeProvider intentionally excluded */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/portals" element={<PortalsPage />} />
                  </Route>

                  {/* Setup (authenticated but no portal yet) */}
                  <Route element={<SetupRoute />}>
                    <Route path="/setup-workspace" element={<WorkspaceSetupPage />} />
                  </Route>

                  {/* Protected tenant routes — BadgeProvider only mounts here, inside a real tenant subdomain */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<BadgeProvider />}>

                      {/* Dashboard */}
                      <Route
                        path="/dashboard"
                        element={<TenantRoute><RoleDashboard /></TenantRoute>}
                      />

                      {/* Client portal */}
                      <Route
                        path="/portal"
                        element={<TenantRoute><RoleDashboard /></TenantRoute>}
                      />

                      {/* ── Client management (provider) ── */}
                      <Route
                        path="/clients"
                        element={<TenantRoute><ClientsPage /></TenantRoute>}
                      />
                      <Route
                        path="/clients/:clientId"
                        element={<TenantRoute><ClientDetailPage /></TenantRoute>}
                      />

                      {/* ── Requests (provider) ── */}
                      <Route
                        path="/requests"
                        element={<TenantRoute><RequestsPage /></TenantRoute>}
                      />
                      <Route
                        path="/requests/:requestId"
                        element={<TenantRoute><RequestDetailPage /></TenantRoute>}
                      />

                      {/* ── Activity (provider) ── */}
                      <Route
                        path="/activity"
                        element={<TenantRoute><ActivityPage /></TenantRoute>}
                      />

                      {/* ── My requests (client) ── */}
                      <Route
                        path="/my-requests"
                        element={<TenantRoute><ClientRequestsPage /></TenantRoute>}
                      />
                      <Route
                        path="/my-requests/:requestId"
                        element={<TenantRoute><ClientRequestDetailPage /></TenantRoute>}
                      />

                      {/* ── Upgrade (provider) ── */}
                      <Route
                        path="/upgrade"
                        element={<TenantRoute><UpgradePage /></TenantRoute>}
                      />

                    </Route>
                  </Route>

                  {/* Misc */}
                  <Route path="/workspace-not-found" element={<WorkspaceNotFoundPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
                <UpgradeModal />
                <UpgradeSuccessModal />
              </TenantGuard>
            </AuthProvider>
          } />

        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}