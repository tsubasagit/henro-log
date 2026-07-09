import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import AuthGate from './auth/AuthGate';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';
import { ensureSeed } from './db/seed';
import './index.css';

void ensureSeed();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PwaUpdatePrompt />
    <AuthProvider>
      <AuthGate>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </AuthGate>
    </AuthProvider>
  </React.StrictMode>,
);
