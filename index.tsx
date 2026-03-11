
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NexusDataProvider } from './hooks/useNexusData';

const WS_URL = (import.meta as any).env?.VITE_WS_URL ?? 'ws://localhost:8000/ws';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <NexusDataProvider wsUrl={WS_URL}>
      <App />
    </NexusDataProvider>
  </React.StrictMode>
);
