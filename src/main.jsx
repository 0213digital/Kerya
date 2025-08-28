import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
// REMOVED: import { LanguageProvider } from './contexts/LanguageContext';
import { SessionProvider } from './contexts/SessionContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './index.css';

// ADDED: Import the i18next configuration to initialize it
import './i18n'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* REMOVED: <LanguageProvider> wrapper */}
    <BrowserRouter>
      <SessionProvider>
        <ProfileProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ProfileProvider>
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>,
)