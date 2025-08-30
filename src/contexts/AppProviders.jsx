import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SessionProvider } from './SessionContext';
import { ProfileProvider } from './ProfileContext';
import { AuthProvider } from './AuthContext';

export function AppProviders({ children }) {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <SessionProvider>
          <ProfileProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ProfileProvider>
        </SessionProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
