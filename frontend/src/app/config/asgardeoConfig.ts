export const asgardeoConfig = {
  signInRedirectURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  signOutRedirectURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  clientID: "pyfb1DKeI8kklfLqIyEfXZc5Urka",
  baseUrl: "https://api.asgardeo.io/t/pixelaura",
  scope: ["openid", "profile", "email", "roles", "groups"]
};

export const API_BASE_URL = "http://localhost:8081/api/v1";
