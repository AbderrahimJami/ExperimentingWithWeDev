import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import Button from '../components/Button'
import FormField from '../components/FormField'
import { confirmSignIn, mapAuthError } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const codeStepLabels = {
  CONFIRM_SIGN_IN_WITH_SMS_CODE: 'Enter the SMS code we sent to your phone.',
  CONFIRM_SIGN_IN_WITH_TOTP_CODE:
    'Enter the code from your authenticator app.',
  CONFIRM_SIGN_IN_WITH_EMAIL_CODE:
    'Enter the code we sent to your email address.',
}

const methodLabels = {
  SMS: 'Text message (SMS)',
  TOTP: 'Authenticator app (TOTP)',
  EMAIL: 'Email code',
}

export default function ConfirmSignInPage() {
  const { setUser } = useAuth()
  const { addToast } = useToast()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const email = searchParams.get('email') || location.state?.email || ''
  const from = location.state?.from || '/dashboard'
  const initialStep = location.state?.nextStep?.signInStep || ''
  const allowedMFATypes = location.state?.nextStep?.allowedMFATypes || []
  const [step, setStep] = useState(initialStep)
  const [form, setForm] = useState({ code: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')

  const isSelectionStep = step === 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION'
  const isCodeStep = Boolean(codeStepLabels[step])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectMethod = async (method) => {
    setError('')
    setNotice('')
    setStatus('loading')

    try {
      await confirmSignIn({ challengeResponse: method })
      setUser({ email })
      addToast({ message: 'Signed in successfully.', tone: 'success' })
      navigate(from, { replace: true })
    } catch (err) {
      if (err.code === 'NextStepRequired') {
        setStep(err.nextStep?.signInStep || '')
        setStatus('idle')
        setNotice(err.message)
        return
      }
      setError(mapAuthError(err))
      setStatus('error')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setStatus('loading')

    try {
      await confirmSignIn({ challengeResponse: form.code })
      setUser({ email })
      addToast({ message: 'Signed in successfully.', tone: 'success' })
      navigate(from, { replace: true })
    } catch (err) {
      if (err.code === 'NextStepRequired') {
        setStep(err.nextStep?.signInStep || '')
        setStatus('idle')
        setNotice(err.message)
        return
      }
      setError(mapAuthError(err))
      setStatus('error')
    }
  }

  return (
    <AuthLayout
      title="Verify your sign-in"
      subtitle="Complete the additional step required by your security settings."
      sideTitle="Secure access"
      sideCopy="Multi-factor authentication keeps your experiences protected."
      sideHighlights={[
        'Enter the code from your chosen method',
        'Use an authenticator app or SMS',
        'Return to login if you need to restart',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate">
            Confirm sign-in
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            Complete verification
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
        {isSelectionStep ? (
          <div className="space-y-4">
            <p className="text-sm text-slate">
              Choose a verification method to continue.
            </p>
            <div className="flex flex-col gap-3">
              {(allowedMFATypes.length
                ? allowedMFATypes
                : ['SMS', 'TOTP']
              ).map((method) => (
                <Button
                  key={method}
                  type="button"
                  onClick={() => handleSelectMethod(method)}
                  variant="secondary"
                  className="justify-between"
                  disabled={status === 'loading'}
                >
                  <span>{methodLabels[method] || method}</span>
                  <span className="text-xs text-slate">Continue</span>
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {isCodeStep ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormField
              label="Verification code"
              id="code"
              name="code"
              type="text"
              value={form.code}
              onChange={handleChange}
              placeholder="Enter the 6-digit code"
              autoComplete="one-time-code"
              helper={codeStepLabels[step]}
            />
            <Button
              type="submit"
              disabled={status === 'loading' || !form.code}
              className="w-full"
            >
              {status === 'loading' ? 'Verifying...' : 'Confirm sign-in'}
            </Button>
          </form>
        ) : null}
        {!isSelectionStep && !isCodeStep ? (
          <div className="rounded-2xl border border-clay/70 bg-mist px-4 py-3 text-sm text-slate">
            This sign-in step is not supported yet. Return to login or contact
            support.
          </div>
        ) : null}
        <p className="text-sm text-slate">
          Back to{' '}
          <Link to="/login" className="font-semibold text-ink hover:underline">
            login
          </Link>
          .
        </p>
      </div>
    </AuthLayout>
  )
}
