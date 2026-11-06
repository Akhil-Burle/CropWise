import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/noto-sans';
import '@fontsource/noto-sans-devanagari/400.css';
import '@fontsource/noto-sans-devanagari/600.css';
import '@fontsource/noto-sans-devanagari/700.css';
import '@fontsource/noto-sans-kannada/400.css';
import '@fontsource/noto-sans-kannada/600.css';
import '@fontsource/noto-sans-kannada/700.css';
import '@fontsource/noto-sans-tamil/400.css';
import '@fontsource/noto-sans-tamil/700.css';
import '@fontsource/noto-sans-telugu/400.css';
import '@fontsource/noto-sans-telugu/700.css';
import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/700.css';
import '@fontsource/noto-sans-gujarati/400.css';
import '@fontsource/noto-sans-gujarati/700.css';
import '@fontsource/noto-sans-malayalam/400.css';
import '@fontsource/noto-sans-malayalam/700.css';
import '@fontsource/noto-sans-gurmukhi/400.css';
import '@fontsource/noto-sans-gurmukhi/700.css';
import '@fontsource/noto-sans-oriya/400.css';
import '@fontsource/noto-sans-oriya/700.css';
import './styles/index.css';
import './i18n';
import App from './App';
import { Capacitor } from '@capacitor/core';

// Offline app shell for the website (the Android app already has its files on the phone).
if (import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
