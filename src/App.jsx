import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const isLaunchView = /^\/experiences\/[^/]+\/launch/.test(location.pathname)

  return (
    <div className="min-h-screen flex flex-col">
      {isLaunchView ? null : <Header />}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <LandingPage />
                </PageTransition>
              }
            />
            <Route
              path="/login"
              element={
                <PageTransition>
                  <LoginPage />
                </PageTransition>
              }
            />
            <Route
              path="/signup"
              element={
                <PageTransition>
                  <SignupPage />
                </PageTransition>
              }
            />
            <Route
              path="/confirm-signup"
              element={
                <PageTransition>
                  <ConfirmSignupPage />
                </PageTransition>
              }
            />
            <Route
              path="/confirm-signin"
              element={
                <PageTransition>
                  <ConfirmSignInPage />
                </PageTransition>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PageTransition>
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                </PageTransition>
              }
            />
            <Route
              path="/experiences/:experienceId"
              element={
                <PageTransition>
                  <ProtectedRoute>
                    <ExperiencePage />
                  </ProtectedRoute>
                </PageTransition>
              }
            />
            <Route
              path="/experiences/:experienceId/launch"
              element={
                <PageTransition>
                  <ProtectedRoute>
                    <ExperienceLaunchPage />
                  </ProtectedRoute>
                </PageTransition>
              }
            />
            <Route
              path="/settings"
              element={
                <PageTransition>
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                </PageTransition>
              }
            />
            <Route
              path="*"
              element={
                <PageTransition>
                  <LandingPage />
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      {isLaunchView ? null : <Footer />}
    </div>
  )
}
