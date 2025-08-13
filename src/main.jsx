import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LanguageProvider } from './contexts/LanguageContext';
import { SessionProvider } from './contexts/SessionContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <SessionProvider>
          <ProfileProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ProfileProvider>
        </SessionProvider>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>,
)