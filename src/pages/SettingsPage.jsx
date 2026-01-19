import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import Button from '../components/Button'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  changePassword,
  confirmTotpSetup,
  getAvatarUrl,
  getMfaPreference,
  getUserProfile,
  setMfaPreference,
  startTotpSetup,
  updateProfile,
  uploadAvatar,
} from '../services/authService'

const mfaOptions = [
  { id: 'none', label: 'No MFA' },
  { id: 'sms', label: 'Text message (SMS)' },
  { id: 'totp', label: 'Authenticator app (TOTP)' },
]

const storageConfigured = Boolean(
  import.meta.env.VITE_STORAGE_BUCKET &&
    import.meta.env.VITE_STORAGE_REGION &&
    import.meta.env.VITE_IDENTITY_POOL_ID
)

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth()
  const { addToast } = useToast()
  const [profileStatus, setProfileStatus] = useState('idle')
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    preferredUsername: '',
    picture: '',
  })
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarStatus, setAvatarStatus] = useState('idle')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordStatus, setPasswordStatus] = useState('idle')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaStatus, setMfaStatus] = useState('idle')
  const [mfaSelection, setMfaSelection] = useState('none')
  const [mfaEnabled, setMfaEnabled] = useState([])
  const [totpSetup, setTotpSetup] = useState({
    secret: '',
    uri: '',
    code: '',
    verified: false,
  })
  const [totpQrUrl, setTotpQrUrl] = useState('')
  const isTotpEnabled = mfaEnabled.includes('TOTP') || totpSetup.verified

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const data = await getUserProfile()
        if (!isMounted) {
          return
        }
        setProfile(data)
        if (data.picture) {
          const url = await getAvatarUrl(data.picture)
          if (isMounted) {
            setAvatarUrl(url)
          }
        }
      } catch (error) {
        addToast({
          message: 'Unable to load profile details.',
          tone: 'error',
        })
      }
    }

    const loadMfa = async () => {
      try {
        const result = await getMfaPreference()
        if (!isMounted) {
          return
        }

        const preferred = result.preferred || 'NONE'
        const enabled = result.enabled || []
        setMfaEnabled(enabled)

        if (preferred === 'SMS') {
          setMfaSelection('sms')
        } else if (preferred === 'TOTP') {
          setMfaSelection('totp')
        } else {
          setMfaSelection('none')
        }
      } catch (error) {
        addToast({
          message: 'Unable to load MFA preferences.',
          tone: 'error',
        })
      }
    }

    loadProfile()
    loadMfa()

    return () => {
      isMounted = false
    }
  }, [addToast])

  useEffect(() => {
    let isMounted = true

    if (!totpSetup.uri) {
      setTotpQrUrl('')
      return () => {
        isMounted = false
      }
    }

    QRCode.toDataURL(totpSetup.uri)
      .then((url) => {
        if (isMounted) {
          setTotpQrUrl(url)
        }
      })
      .catch(() => {
        if (isMounted) {
          setTotpQrUrl('')
        }
      })

    return () => {
      isMounted = false
    }
  }, [totpSetup.uri])

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setProfileStatus('loading')
    try {
      await updateProfile({
        name: profile.name,
        preferredUsername: profile.preferredUsername,
      })
      await refreshProfile()
      setProfileStatus('success')
      addToast({ message: 'Profile updated.', tone: 'success' })
    } catch (error) {
      setProfileStatus('error')
      addToast({ message: 'Profile update failed.', tone: 'error' })
    }
  }

  const handleAvatarChange = (event) => {
    const [file] = event.target.files || []
    setAvatarFile(file || null)
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      return
    }

    setAvatarStatus('loading')
    try {
      const path = await uploadAvatar({
        file: avatarFile,
        email: profile.email || user?.email,
      })
      const url = await getAvatarUrl(path)
      setAvatarUrl(url)
      setProfile((prev) => ({ ...prev, picture: path }))
      setAvatarFile(null)
      await refreshProfile()
      setAvatarStatus('success')
      addToast({ message: 'Avatar updated.', tone: 'success' })
    } catch (error) {
      setAvatarStatus('error')
      addToast({
        message: 'Avatar upload failed. Check storage configuration.',
        tone: 'error',
      })
    }
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordStatus('loading')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus('error')
      setPasswordError('Passwords do not match.')
      return
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordStatus('success')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      addToast({ message: 'Password updated.', tone: 'success' })
    } catch (error) {
      setPasswordStatus('error')
      setPasswordError('Unable to update password. Check your current password.')
    }
  }

  const handleMfaSave = async () => {
    setMfaStatus('loading')

    if (
      mfaSelection === 'totp' &&
      !totpSetup.verified &&
      !mfaEnabled.includes('TOTP')
    ) {
      setMfaStatus('idle')
      addToast({
        message: 'Set up and verify TOTP before enabling it.',
        tone: 'warning',
      })
      return
    }

    const nextSms =
      mfaSelection === 'sms' ? 'PREFERRED' : 'DISABLED'
    const nextTotp =
      mfaSelection === 'totp' ? 'PREFERRED' : 'DISABLED'

    try {
      await setMfaPreference({ sms: nextSms, totp: nextTotp })
      setMfaStatus('success')
      if (mfaSelection === 'sms') {
        setMfaEnabled(['SMS'])
      } else if (mfaSelection === 'totp') {
        setMfaEnabled(['TOTP'])
      } else {
        setMfaEnabled([])
      }
      addToast({ message: 'MFA preferences updated.', tone: 'success' })
    } catch (error) {
      setMfaStatus('error')
      addToast({
        message: 'Unable to update MFA preferences.',
        tone: 'error',
      })
    }
  }

  const handleTotpSetup = async () => {
    setMfaStatus('loading')
    try {
      const result = await startTotpSetup({ email: profile.email })
      setTotpSetup((prev) => ({
        ...prev,
        secret: result.secret,
        uri: result.uri,
      }))
      setMfaStatus('idle')
    } catch (error) {
      setMfaStatus('error')
      addToast({ message: 'Unable to start TOTP setup.', tone: 'error' })
    }
  }

  const handleTotpVerify = async () => {
    setMfaStatus('loading')
    try {
      await confirmTotpSetup({ code: totpSetup.code })
      setTotpSetup((prev) => ({ ...prev, verified: true }))
      await setMfaPreference({ sms: 'DISABLED', totp: 'PREFERRED' })
      setMfaSelection('totp')
      setMfaEnabled(['TOTP'])
      setMfaStatus('success')
      addToast({ message: 'Authenticator app verified.', tone: 'success' })
    } catch (error) {
      setMfaStatus('error')
      addToast({ message: 'TOTP verification failed.', tone: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate">
            Settings
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink">
            Profile & security
          </h1>
          <p className="mt-3 text-slate">
            Update your profile, security settings, and avatar.
          </p>
        </div>
        <Button as={Link} to="/dashboard" variant="secondary">
          Back to dashboard
        </Button>
      </div>

      <div className="mt-10 grid gap-6">
        <section className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-soft backdrop-blur">
          <h2 className="font-display text-xl text-ink">Profile details</h2>
          <p className="mt-2 text-sm text-slate">
            Syncs name and preferred username back to Cognito.
          </p>
          <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handleProfileSubmit}>
            <FormField
              label="Full name"
              id="name"
              name="name"
              type="text"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Your name"
            />
            <FormField
              label="Preferred username"
              id="preferredUsername"
              name="preferredUsername"
              type="text"
              value={profile.preferredUsername}
              onChange={handleProfileChange}
              placeholder="Display handle"
            />
            <FormField
              label="Email"
              id="email"
              name="email"
              type="email"
              value={profile.email || user?.email || ''}
              onChange={() => {}}
              readOnly
              placeholder="you@company.com"
            />
            <div className="flex items-end">
              <Button type="submit" disabled={profileStatus === 'loading'}>
                {profileStatus === 'loading' ? 'Saving...' : 'Save profile'}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-soft backdrop-blur">
          <h2 className="font-display text-xl text-ink">Avatar</h2>
          <p className="mt-2 text-sm text-slate">
            Upload a profile picture stored in S3 via Amplify Storage.
          </p>
          {!storageConfigured ? (
            <div className="mt-4 rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
              Storage is not configured. Set VITE_STORAGE_BUCKET,
              VITE_STORAGE_REGION, and VITE_IDENTITY_POOL_ID.
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-clay/70 bg-mist">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate">
                  No photo
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="text-sm text-slate"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={
                    avatarStatus === 'loading' ||
                    !avatarFile ||
                    !storageConfigured
                  }
                >
                  {avatarStatus === 'loading' ? 'Uploading...' : 'Upload avatar'}
                </Button>
                <p className="text-xs text-slate">
                  PNG or JPG up to 2MB recommended.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-soft backdrop-blur">
          <h2 className="font-display text-xl text-ink">Change password</h2>
          <p className="mt-2 text-sm text-slate">
            Update your password while signed in.
          </p>
          {passwordError ? (
            <div className="mt-4 rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
              {passwordError}
            </div>
          ) : null}
          <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handlePasswordSubmit}>
            <FormField
              label="Current password"
              id="currentPassword"
              name="currentPassword"
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Current password"
              autoComplete="current-password"
            />
            <FormField
              label="New password"
              id="newPassword"
              name="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="New password"
              autoComplete="new-password"
            />
            <FormField
              label="Confirm new password"
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
            <div className="flex flex-col items-start gap-3 md:items-end">
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs font-semibold text-ink hover:underline"
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
              <Button type="submit" disabled={passwordStatus === 'loading'}>
                {passwordStatus === 'loading' ? 'Updating...' : 'Change password'}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-soft backdrop-blur">
          <h2 className="font-display text-xl text-ink">Multi-factor authentication</h2>
          <p className="mt-2 text-sm text-slate">
            Choose how you want to verify sign-ins.
          </p>
          <div className="mt-6 space-y-3">
            {mfaOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                  mfaSelection === option.id
                    ? 'border-ink bg-ink text-sand'
                    : 'border-clay/70 bg-white text-slate'
                }`}
              >
                <span>{option.label}</span>
                <input
                  type="radio"
                  name="mfaSelection"
                  value={option.id}
                  checked={mfaSelection === option.id}
                  onChange={() => setMfaSelection(option.id)}
                  className="h-4 w-4 text-ink"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate">
            <span>
              Enabled methods: {mfaEnabled.length ? mfaEnabled.join(', ') : 'None'}
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={handleMfaSave}
              disabled={mfaStatus === 'loading'}
            >
              {mfaStatus === 'loading' ? 'Saving...' : 'Save MFA preference'}
            </Button>
          </div>
          {mfaSelection === 'sms' ? (
            <p className="mt-3 text-xs text-slate">
              SMS MFA requires a verified phone number on your Cognito profile.
            </p>
          ) : null}
          {mfaSelection === 'totp' ? (
            <div className="mt-6 rounded-2xl border border-clay/70 bg-mist px-4 py-4 text-sm text-slate">
              {isTotpEnabled ? (
                <>
                  <p className="font-semibold text-ink">TOTP is enabled</p>
                  <p className="mt-2 text-xs">
                    Your authenticator app is already linked. To reconfigure,
                    disable MFA and set it up again.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-ink">Set up TOTP</p>
                  <p className="mt-2 text-xs">
                    Generate a secret, scan it with your authenticator app, then
                    enter the code to verify.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleTotpSetup}
                    >
                      Generate setup code
                    </Button>
                    {totpSetup.verified ? (
                      <span className="text-xs text-ink">Verified</span>
                    ) : null}
                  </div>
                  {totpSetup.secret ? (
                    <div className="mt-4 space-y-2 text-xs">
                      {totpQrUrl ? (
                        <div className="rounded-2xl border border-clay/70 bg-white px-4 py-4 text-center">
                          <img
                            src={totpQrUrl}
                            alt="Authenticator app QR code"
                            className="mx-auto h-36 w-36"
                          />
                        </div>
                      ) : null}
                      <p>
                        <span className="font-semibold text-ink">Secret:</span>{' '}
                        {totpSetup.secret}
                      </p>
                      <p className="break-all">
                        <span className="font-semibold text-ink">Setup URI:</span>{' '}
                        {totpSetup.uri}
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <FormField
                          label="Verification code"
                          id="totpCode"
                          name="code"
                          type="text"
                          value={totpSetup.code}
                          onChange={(event) =>
                            setTotpSetup((prev) => ({
                              ...prev,
                              code: event.target.value,
                            }))
                          }
                          placeholder="Enter the 6-digit code"
                          autoComplete="one-time-code"
                        />
                        <Button type="button" onClick={handleTotpVerify}>
                          Verify TOTP
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
