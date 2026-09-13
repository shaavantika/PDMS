import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedRoute, RequireRole } from './auth/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectListPage } from './pages/ProjectListPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ModuleDetailPage } from './pages/ModuleDetailPage'
import { RequirementDetailPage } from './pages/RequirementDetailPage'
import { TasksPage } from './pages/TasksPage'
import { ApprovalsPage } from './pages/ApprovalsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { UserManagementPage } from './pages/admin/UserManagementPage'

function LoginRoute() {
  const { user } = useAuth()
  if (user) return <Navigate to="/" replace />
  return <LoginPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectListPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/projects/:id/modules/:moduleId" element={<ModuleDetailPage />} />
              <Route path="/projects/:id/modules/:moduleId/requirements/:reqId" element={<RequirementDetailPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/users"
                element={
                  <RequireRole roles={['admin']}>
                    <UserManagementPage />
                  </RequireRole>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
