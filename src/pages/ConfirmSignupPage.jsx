import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import Button from '../components/Button'
import FormField from '../components/FormField'
import {
  confirmSignUp,
  resendSignUpCode,
  mapAuthError,
} from '../services/authService'
import { useToast } from '../context/ToastContext'

const RESEND_COOLDOWN_SECONDS = 30

export default function ConfirmSignupPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const initialEmail = searchParams.get('email') || ''
  const [form, setForm] = useState({ email: initialEmail, code: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const [resendStatus, setResendStatus] = useState('idle')
  const [resendMessage, setResendMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined
    }

    const timer = setTimeout(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setStatus('loading')

    try {
      await confirmSignUp({ email: form.email, code: form.code })
      setStatus('success')
      addToast({ message: 'Account confirmed. You can sign in.', tone: 'success' })
      navigate(`/login?email=${encodeURIComponent(form.email)}`, {
        replace: true,
        state: { notice: 'Account confirmed. Please sign in.' },
      })
    } catch (err) {
      setError(mapAuthError(err))
      setStatus('error')
    }
  }

  const handleResend = async () => {
    setError('')
    setResendMessage('')
    setResendStatus('loading')

    try {
      await resendSignUpCode({ email: form.email })
      setResendMessage('A new verification code has been sent to your email.')
      setResendStatus('success')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setError(mapAuthError(err))
      setResendStatus('error')
    }
  }

  const isDisabled = status === 'loading' || !form.email || !form.code
  const canResend =
    resendStatus !== 'loading' && form.email && resendCooldown === 0

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the confirmation code to activate your account."
      sideTitle="Almost there"
      sideCopy="Cognito keeps new accounts locked until the email address is verified."
      sideHighlights={[
        'Use the code sent to your inbox',
        'Resend a code if it has expired',
        'Return to login once confirmed',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate">
            Confirm sign up
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            Enter your verification code
          </h2>
        </div>
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
        {resendMessage ? (
          <div className="rounded-2xl border border-clay/70 bg-mist px-4 py-3 text-sm text-slate">
            {resendMessage}
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
            label="Confirmation code"
            id="code"
            name="code"
            type="text"
            value={form.code}
            onChange={handleChange}
            placeholder="Enter the 6-digit code"
            autoComplete="one-time-code"
            helper="Check your email inbox or spam folder."
          />
          <Button type="submit" disabled={isDisabled} className="w-full">
            {status === 'loading' ? 'Confirming...' : 'Confirm account'}
          </Button>
        </form>
        <div className="flex flex-col gap-3 text-sm text-slate sm:flex-row sm:items-center sm:justify-between">
          <span>
            Didn't receive the code?
            {resendCooldown > 0
              ? ` You can resend in ${resendCooldown}s.`
              : ''}
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={!canResend}
          >
            {resendStatus === 'loading' ? 'Sending...' : 'Resend code'}
          </Button>
        </div>
        <p className="text-sm text-slate">
          Ready to sign in?{' '}
          <Link to="/login" className="font-semibold text-ink hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
