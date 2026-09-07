/// <reference types="vite/client" />

const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

export const asgardeoConfig = {
  signInRedirectURL: import.meta.env.VITE_ASGARDEO_SIGN_IN_REDIRECT_URL || `${defaultOrigin}/callback`,
  signOutRedirectURL: import.meta.env.VITE_ASGARDEO_SIGN_OUT_REDIRECT_URL || defaultOrigin,
  clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID || "pyfb1DKeI8kklfLqIyEfXZc5Urka",
  baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL || "https://api.asgardeo.io/t/pixelaura",
  scope: import.meta.env.VITE_ASGARDEO_SCOPES
    ? (import.meta.env.VITE_ASGARDEO_SCOPES as string).split(',').map(s => s.trim())
    : ["openid", "profile", "email", "roles", "groups"]
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:8243/api/v1/tenants/1.0.0";
