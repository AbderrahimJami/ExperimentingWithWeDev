import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import Button from '../components/Button'
import FormField from '../components/FormField'
import { signIn, mapAuthError } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const { setUser } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const [form, setForm] = useState({
    email: initialEmail,
    password: '',
    remember: false,
  })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const notice =
    location.state?.notice ||
    (location.state?.from ? 'Please sign in to continue.' : '')

  const from =
    location.state?.from?.pathname
      ? `${location.state.from.pathname}${location.state.from.search || ''}`
      : '/dashboard'

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('loading')
    try {
      const result = await signIn({
        email: form.email,
        password: form.password,
      })
      setUser(result.user)
      addToast({ message: 'Signed in successfully.', tone: 'success' })
      navigate(from, { replace: true })
    } catch (err) {
      if (err.code === 'NextStepRequired') {
        setStatus('idle')
        navigate(`/confirm-signin?email=${encodeURIComponent(form.email)}`, {
          state: {
            notice: err.message,
            nextStep: err.nextStep,
            email: form.email,
            from,
          },
        })
        return
      }
      setError(mapAuthError(err))
      setStatus('error')
    }
  }

  const isDisabled = status === 'loading' || !form.email || !form.password

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue building your Cognito-ready experience."
      sideTitle="Why teams pick this flow"
      sideCopy="Keep the UI sharp today, then swap in Cognito calls without reworking the interface."
      sideHighlights={[
        'Clear handoff points for Hosted UI or Amplify',
        'Accessible form markup and states',
        'Consistent layout across landing and auth',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate">Log in</p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            Sign in to your workspace
          </h2>
        </div>
        {status === 'idle' && !form.email && !form.password ? (
          <div className="rounded-2xl border border-clay/70 bg-mist px-4 py-3 text-sm text-slate">
            Tip: use any email and a 6+ character password for the demo.
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-2xl border border-clay/70 bg-mist px-4 py-3 text-sm text-slate">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
            {error}
          </div>
        ) : null}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <FormField
            label="Email"
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            autoComplete="email"
          />
          <FormField
            label="Password"
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            helper="Minimum 6 characters for the demo."
          />
          <div className="flex items-center justify-end text-xs text-slate">
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="font-semibold text-ink hover:underline"
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
          </div>
          <div className="flex items-center justify-between text-sm text-slate">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="h-4 w-4 rounded border-clay/70 text-ink focus:ring-ink/20"
              />
              Remember me
            </label>
            <Link to="/login?reset=true" className="text-ink hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" disabled={isDisabled} className="w-full">
            {status === 'loading' ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="text-sm text-slate">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-ink hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
