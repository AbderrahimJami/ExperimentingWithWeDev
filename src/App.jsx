import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ConfirmSignupPage from './pages/ConfirmSignupPage'
import ConfirmSignInPage from './pages/ConfirmSignInPage'
import DashboardPage from './pages/DashboardPage'
import ExperiencePage from './pages/ExperiencePage'
import ExperienceLaunchPage from './pages/ExperienceLaunchPage'
import SettingsPage from './pages/SettingsPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const location = useLocation()
  const isLaunchView = /^\/experiences\/[^/]+\/launch/.test(location.pathname)

  return (
    <div className="min-h-screen flex flex-col">
      {isLaunchView ? null : <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/confirm-signup" element={<ConfirmSignupPage />} />
          <Route path="/confirm-signin" element={<ConfirmSignInPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/experiences/:experienceId"
            element={
              <ProtectedRoute>
                <ExperiencePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/experiences/:experienceId/launch"
            element={
              <ProtectedRoute>
                <ExperienceLaunchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      {isLaunchView ? null : <Footer />}
    </div>
  )
}
