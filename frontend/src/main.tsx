import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AsgardeoProvider } from '@asgardeo/react'
import App from './app/App'
import './styles/index.css'
import { asgardeoConfig } from './app/config/asgardeoConfig'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AsgardeoProvider
      baseUrl={asgardeoConfig.baseUrl}
      clientId={asgardeoConfig.clientID}
      afterSignInUrl={asgardeoConfig.signInRedirectURL}
      afterSignOutUrl={asgardeoConfig.signOutRedirectURL}
      scope={asgardeoConfig.scope}
      {...({
        signInRedirectURL: asgardeoConfig.signInRedirectURL,
        signOutRedirectURL: asgardeoConfig.signOutRedirectURL,
      } as any)}
    >
      <App />
    </AsgardeoProvider>
  </StrictMode>
)