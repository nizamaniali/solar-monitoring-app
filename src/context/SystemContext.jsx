import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseBrother } from '../lib/supabaseBrother';

const SystemContext = createContext(undefined);

const STORAGE_KEY = '@solar_monitor_selected_system';

export function SystemProvider({ children }) {
  const [selectedSystem, setSelectedSystemState] = useState('mine');
  const [isSystemLoaded, setIsSystemLoaded] = useState(false);

  useEffect(() => {
    function loadSystem() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'mine' || saved === 'brother') {
          setSelectedSystemState(saved);
        }
      } catch (error) {
        console.error('Could not load selected system:', error);
      } finally {
        setIsSystemLoaded(true);
      }
    }

    loadSystem();
  }, []);

  async function setSelectedSystem(system) {
    setSelectedSystemState(system);
    try {
      localStorage.setItem(STORAGE_KEY, system);
    } catch (error) {
      console.error('Could not save selected system:', error);
    }
  }

  const activeSupabase = selectedSystem === 'mine' ? supabase : supabaseBrother;

  return (
    <SystemContext.Provider
      value={{
        selectedSystem,
        setSelectedSystem,
        activeSupabase,
        isSystemLoaded,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

export function useSolarSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSolarSystem must be used inside SystemProvider');
  }
  return context;
}
