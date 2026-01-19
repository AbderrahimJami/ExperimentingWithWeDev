import {
  signIn as amplifySignIn,
  confirmSignIn as amplifyConfirmSignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode as amplifyResendSignUpCode,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  updateUserAttributes,
  fetchUserAttributes,
  updatePassword,
  fetchMFAPreference,
  updateMFAPreference,
  setUpTOTP,
  verifyTOTPSetup,
} from 'aws-amplify/auth'
import { uploadData, getUrl } from 'aws-amplify/storage'

const signInStepCopy = {
  CONFIRM_SIGN_IN_WITH_SMS_CODE:
    'Check your phone for a verification code to finish signing in.',
  CONFIRM_SIGN_IN_WITH_TOTP_CODE:
    'Enter the code from your authenticator app to finish signing in.',
  CONFIRM_SIGN_IN_WITH_EMAIL_CODE:
    'Check your email for a verification code to finish signing in.',
  CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED:
    'You need to set a new password before signing in.',
  RESET_PASSWORD: 'You need to reset your password before signing in.',
  CONTINUE_SIGN_IN_WITH_MFA_SELECTION:
    'Select an MFA method to continue signing in.',
  CONTINUE_SIGN_IN_WITH_TOTP_SETUP:
    'Set up an authenticator app to finish signing in.',
}

const signUpStepCopy = {
  CONFIRM_SIGN_UP:
    'Check your email for a verification code to activate your account.',
  COMPLETE_AUTO_SIGN_IN: 'Your account is ready. Please sign in to continue.',
}

const getNextStepMessage = (nextStep, stepCopy, fallback) => {
  if (!nextStep || (!nextStep.signInStep && !nextStep.signUpStep)) {
    return fallback
  }

  const step = nextStep.signInStep || nextStep.signUpStep
  if (stepCopy[step]) {
    return stepCopy[step]
  }

  return fallback
}

const validateEmail = (email) => email && email.includes('@')

export async function signIn({ email, password }) {
  if (!email || !password) {
    throw {
      code: 'ValidationException',
      message: 'Email and password are required.',
    }
  }

  if (!validateEmail(email)) {
    throw {
      code: 'InvalidParameterException',
      message: 'Enter a valid email address.',
    }
  }

  const result = await amplifySignIn({
    username: email,
    password,
  })

  if (!result.isSignedIn) {
    throw {
      code: 'NextStepRequired',
      message: getNextStepMessage(
        result.nextStep,
        signInStepCopy,
        'Additional verification is required to finish signing in.'
      ),
      nextStep: result.nextStep,
    }
  }

  return { user: { email } }
}

export async function confirmSignIn({ challengeResponse }) {
  if (!challengeResponse) {
    throw {
      code: 'ValidationException',
      message: 'Verification code is required.',
    }
  }

  const result = await amplifyConfirmSignIn({
    challengeResponse,
  })

  if (!result.isSignedIn) {
    throw {
      code: 'NextStepRequired',
      message: getNextStepMessage(
        result.nextStep,
        signInStepCopy,
        'Additional verification is required to finish signing in.'
      ),
      nextStep: result.nextStep,
    }
  }

  return result
}

export async function signUp({ email, password, confirmPassword }) {
  if (!email || !password || !confirmPassword) {
    throw {
      code: 'ValidationException',
      message: 'All fields are required.',
    }
  }

  if (!validateEmail(email)) {
    throw {
      code: 'InvalidParameterException',
      message: 'Enter a valid email address.',
    }
  }

  if (password !== confirmPassword) {
    throw {
      code: 'PasswordMismatch',
      message: 'Passwords do not match.',
    }
  }

  const result = await amplifySignUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
      },
    },
  })

  if (!result.isSignUpComplete) {
    throw {
      code: 'NextStepRequired',
      message: getNextStepMessage(
        result.nextStep,
        signUpStepCopy,
        'Confirm your account to finish signing up.'
      ),
    }
  }

  return { user: { email } }
}

export async function confirmSignUp({ email, code }) {
  if (!email || !code) {
    throw {
      code: 'ValidationException',
      message: 'Email and confirmation code are required.',
    }
  }

  if (!validateEmail(email)) {
    throw {
      code: 'InvalidParameterException',
      message: 'Enter a valid email address.',
    }
  }

  await amplifyConfirmSignUp({
    username: email,
    confirmationCode: code,
  })

  return true
}

export async function resendSignUpCode({ email }) {
  if (!email) {
    throw {
      code: 'ValidationException',
      message: 'Email is required.',
    }
  }

  if (!validateEmail(email)) {
    throw {
      code: 'InvalidParameterException',
      message: 'Enter a valid email address.',
    }
  }

  await amplifyResendSignUpCode({ username: email })
  return true
}

export async function signOut() {
  await amplifySignOut()
  return true
}

export async function getCurrentUser() {
  try {
    const currentUser = await amplifyGetCurrentUser()
    let email = currentUser?.signInDetails?.loginId

    if (!email) {
      const attributes = await fetchUserAttributes()
      email = attributes.email
    }

    return { email: email || currentUser.username }
  } catch (error) {
    return null
  }
}

export async function getUserProfile() {
  const attributes = await fetchUserAttributes()
  return {
    email: attributes.email || '',
    name: attributes.name || '',
    preferredUsername: attributes.preferred_username || '',
    picture: attributes.picture || '',
  }
}

export async function updateProfile({ name, preferredUsername, picture }) {
  const userAttributes = {}

  if (name !== undefined) {
    userAttributes.name = name
  }

  if (preferredUsername !== undefined) {
    userAttributes.preferred_username = preferredUsername
  }

  if (picture !== undefined) {
    userAttributes.picture = picture
  }

  if (!Object.keys(userAttributes).length) {
    return null
  }

  return updateUserAttributes({ userAttributes })
}

export async function changePassword({ currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw {
      code: 'ValidationException',
      message: 'Current and new passwords are required.',
    }
  }

  await updatePassword({
    oldPassword: currentPassword,
    newPassword,
  })

  return true
}

export async function getMfaPreference() {
  return fetchMFAPreference()
}

export async function setMfaPreference({ sms, totp }) {
  return updateMFAPreference({
    sms,
    totp,
  })
}

export async function startTotpSetup({ email }) {
  const result = await setUpTOTP()
  const uri = result.getSetupUri('WeDev', email || undefined)

  return {
    secret: result.sharedSecret,
    uri: uri.toString(),
  }
}

export async function confirmTotpSetup({ code }) {
  if (!code) {
    throw {
      code: 'ValidationException',
      message: 'Verification code is required.',
    }
  }

  await verifyTOTPSetup({ code })
  return true
}

export async function uploadAvatar({ file, email }) {
  if (!file) {
    throw {
      code: 'ValidationException',
      message: 'Select an image to upload.',
    }
  }

  const extension = file.name.split('.').pop() || 'jpg'
  const safeEmail = email ? encodeURIComponent(email.toLowerCase()) : 'user'
  const path = `avatars/${safeEmail}/profile.${extension}`

  const uploadTask = uploadData({
    path,
    data: file,
    options: {
      accessLevel: 'protected',
      contentType: file.type || 'image/jpeg',
    },
  })

  await uploadTask.result
  await updateProfile({ picture: path })

  return path
}

export async function getAvatarUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  try {
    const result = await getUrl({
      path,
      options: {
        accessLevel: 'protected',
      },
    })

    return result.url.toString()
  } catch (error) {
    return ''
  }
}

export function mapAuthError(error) {
  if (!error) {
    return 'Something went wrong. Please try again.'
  }

  const code = error.name || error.code

  if (code === 'NextStepRequired') {
    return error.message
  }

  const codeMap = {
    ValidationException: 'Please fill out all required fields.',
    InvalidParameterException: 'Enter a valid email address.',
    InvalidPasswordException: 'Password does not meet the requirements.',
    PasswordMismatch: 'Passwords do not match.',
    NotAuthorizedException: 'Incorrect email or password.',
    UserNotFoundException: 'No account found with that email.',
    UserNotConfirmedException:
      'Account not confirmed. Check your email for verification.',
    UsernameExistsException: 'An account with this email already exists.',
    PasswordResetRequiredException:
      'Password reset required. Use the forgot password link.',
    CodeMismatchException: 'That code is invalid. Try again.',
    ExpiredCodeException: 'That code has expired. Request a new one.',
    LimitExceededException: 'Too many attempts. Please try again later.',
    TooManyRequestsException: 'Too many requests. Please try again later.',
  }

  if (code && codeMap[code]) {
    return codeMap[code]
  }

  return error.message || 'Unable to continue. Please try again.'
}
