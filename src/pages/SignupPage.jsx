import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import Button from '../components/Button'
import FormField from '../components/FormField'
import { signUp, mapAuthError } from '../services/authService'
import { useAuth } from '../context/AuthContext'

const passwordRules = [
  'Use at least 6 characters',
  'Mix letters and numbers for stronger passwords',
  'Avoid reused passwords from other tools',
]

const getPasswordScore = (password) => {
  if (!password) {
    return 0
  }

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]

  return checks.filter(Boolean).length
}

const strengthLabels = ['Too short', 'Weak', 'Okay', 'Strong', 'Great']

export default function SignupPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    accept: false,
  })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const passwordScore = getPasswordScore(form.password)
  const passwordLabel =
    !form.password || form.password.length < 6
      ? 'Use at least 6 characters.'
      : strengthLabels[Math.max(passwordScore, 1)]

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

    if (!form.accept) {
      setStatus('error')
      setError('Please accept the terms to continue.')
      return
    }

    setStatus('loading')
    try {
      const result = await signUp({
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      })
      setUser(result.user)
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'NextStepRequired') {
        setStatus('idle')
        navigate(`/confirm-signup?email=${encodeURIComponent(form.email)}`, {
          state: { notice: err.message },
        })
        return
      }
      setError(mapAuthError(err))
      setStatus('error')
    }
  }

  const isDisabled =
    status === 'loading' ||
    !form.email ||
    !form.password ||
    !form.confirmPassword

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start with the UI today, connect AWS Cognito when you are ready."
      sideTitle="Built for secure growth"
      sideCopy="The signup flow is ready for verification steps, MFA, and password policies."
      sideHighlights={[
        'Mocked errors that mimic Cognito responses',
        'Ready for email or phone verification',
        'Clear CTA hierarchy across devices',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate">
            Sign up
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            Create a new workspace
          </h2>
        </div>
        {status === 'idle' && !form.email && !form.password ? (
          <div className="rounded-2xl border border-clay/70 bg-mist px-4 py-3 text-sm text-slate">
            Tip: you can use any email to preview the flow.
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
            placeholder="Create a password"
            autoComplete="new-password"
          />
          <FormField
            label="Confirm password"
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
          <div className="flex items-center justify-between text-xs text-slate">
            <span>Password strength: {passwordLabel}</span>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="font-semibold text-ink hover:underline"
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate">
            <input
              type="checkbox"
              name="accept"
              checked={form.accept}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-clay/70 text-ink focus:ring-ink/20"
            />
            I agree to the terms and privacy policy.
          </label>
          <Button type="submit" disabled={isDisabled} className="w-full">
            {status === 'loading' ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <div className="rounded-2xl border border-clay/70 bg-mist px-4 py-4 text-sm text-slate">
          <p className="font-semibold text-ink">Password tips</p>
          <ul className="mt-3 space-y-2">
            {passwordRules.map((rule) => (
              <li key={rule} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sun" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-slate">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-ink hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
