# WeDev Cognito-ready auth UI

A React + Tailwind UI for a landing page, login, signup, and dashboard flow. The auth logic is stubbed so you can wire AWS Cognito later.

## Start

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`

## Cognito wiring points

- `src/main.jsx` configures Amplify with your user pool ID and app client ID.
- `src/services/authService.js` contains `signIn`, `signUp`, and `signOut` wired to Amplify Auth.
- Map Cognito error codes in `mapAuthError` to keep the UI copy consistent.

## Storage setup (avatars)

Avatar uploads use Amplify Storage (S3). Configure these env vars for Vite:

```
VITE_STORAGE_BUCKET=your-bucket-name
VITE_STORAGE_REGION=eu-west-2
VITE_IDENTITY_POOL_ID=eu-west-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

These are read in `src/main.jsx` and used by `src/services/authService.js`.

## AppSync catalog (Option B)

The dashboard can load experiences from AppSync. Configure:

```
VITE_APPSYNC_ENDPOINT=https://your-api-id.appsync-api.eu-west-2.amazonaws.com/graphql
VITE_APPSYNC_REGION=eu-west-2
VITE_APPSYNC_AUTH_MODE=userPool
```

Optional for API key auth:

```
VITE_APPSYNC_AUTH_MODE=apiKey
VITE_APPSYNC_API_KEY=your-api-key
```

The catalog client lives in `src/services/catalogService.js`.


Client [client ID] is configured with secret but SECRET_HASH was not received

### How to fix this

**The simplest and correct fix for a frontend app:**

Create a **new App Client** in your User Pool and **uncheck “Generate client secret”** when creating it. Then use that client ID in your Amplify config (or when importing with `amplify import auth`). Once the client has *no secret*, the error goes away and browser-based SDKs work normally. :contentReference[oaicite:3]{index=3}

Steps in short:

1. Go into your Cognito User Pool → *App clients*.
2. Click **Add another app client**.
3. **Do not check “Generate client secret”**.
4. Use the new App Client ID in your frontend config (e.g., in `aws-exports.js`).
5. Redeploy or re-configure your Amplify auth setup.

Once you have a public client **without a secret**, Amplify and the JavaScript SDK will handle signup/signin without that SECRET_HASH issue. :contentReference[oaicite:4]{index=4}

If you *actually* need a confidential client with a secret (e.g., for secure backend-to-backend auth), then you have to compute and send the `SECRET_HASH` parameter in your API calls — but that’s not typical for browser frontends and isn’t supported by Amplify’s client-side flows directly without custom code. :contentReference[oaicite:5]{index=5}

Would you like a step-by-step snippet showing how to update your Amplify auth config after creating the new client?
::contentReference[oaicite:6]{index=6}
