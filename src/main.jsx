import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LanguageProvider } from './contexts/LanguageContext';
import { SessionProvider } from './contexts/SessionContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Créer une instance de QueryClient
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envelopper l'application avec QueryClientProvider */}
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  </React.StrictMode>,
)