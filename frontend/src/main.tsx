import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AsgardeoProvider } from '@asgardeo/react'
import App from './app/App.tsx'
import './styles/index.css'
import { asgardeoConfig } from './app/config/asgardeoConfig'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AsgardeoProvider
      clientId={asgardeoConfig.clientID}
      baseUrl={asgardeoConfig.baseUrl}
      signInRedirectURL={asgardeoConfig.signInRedirectURL}
      signOutRedirectURL={asgardeoConfig.signOutRedirectURL}
      scope={asgardeoConfig.scope}
    >
      <App />
    </AsgardeoProvider>
  </StrictMode>
)