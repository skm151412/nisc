import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAntiInspection } from './services/antiInspection';

// Initialize frontend anti-inspection & tamper protection deterrent
initAntiInspection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
