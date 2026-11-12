import React from 'react';
import { SystemProvider } from './context/SystemContext';
import AppTabs from './components/AppTabs';

export default function App() {
  return (
    <SystemProvider>
      <AppTabs />
    </SystemProvider>
  );
}
