import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppProviders } from './contexts/AppProviders.jsx';
import './index.css';

// Import the i18next configuration to initialize it
import './i18n'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppProviders>
    <App />
  </AppProviders>
);
