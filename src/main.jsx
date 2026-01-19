import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Amplify } from "aws-amplify";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

const storageBucket = import.meta.env.VITE_STORAGE_BUCKET;
const storageRegion = import.meta.env.VITE_STORAGE_REGION;
const identityPoolId = import.meta.env.VITE_IDENTITY_POOL_ID;
const appSyncEndpoint = import.meta.env.VITE_APPSYNC_ENDPOINT;
const appSyncRegion = import.meta.env.VITE_APPSYNC_REGION;
const appSyncAuthMode =
  import.meta.env.VITE_APPSYNC_AUTH_MODE || "userPool";
const appSyncApiKey = import.meta.env.VITE_APPSYNC_API_KEY;

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: "eu-west-2_UzrTPrwrR",
      userPoolClientId: "1bbmiiv07b4qsghfnb90rv559j",
      loginWith: {
        email: true,
      },
    },
  },
};

if (identityPoolId) {
  amplifyConfig.Auth.Cognito.identityPoolId = identityPoolId;
}

if (storageBucket && storageRegion && identityPoolId) {
  amplifyConfig.Storage = {
    S3: {
      bucket: storageBucket,
      region: storageRegion,
    },
  };
}

if (appSyncEndpoint) {
  amplifyConfig.API = {
    GraphQL: {
      endpoint: appSyncEndpoint,
      region: appSyncRegion,
      defaultAuthMode: appSyncAuthMode,
      ...(appSyncAuthMode === "apiKey" && appSyncApiKey
        ? { apiKey: appSyncApiKey }
        : {}),
    },
  };
}

Amplify.configure(amplifyConfig);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
