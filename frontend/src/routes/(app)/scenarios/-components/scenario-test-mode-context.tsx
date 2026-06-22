import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LedValue } from '@/types/led.types';

export type ScenarioTestModeTarget = 'shutter-speeds' | 'rotations' | `led:${LedValue}`;

export const ledTestModeTarget = (ledValue: LedValue): ScenarioTestModeTarget => `led:${ledValue}`;

interface ScenarioTestModeContextValue {
  activeTestMode: ScenarioTestModeTarget | null;
  isTestModeActive: (target: ScenarioTestModeTarget) => boolean;
  toggleTestMode: (target: ScenarioTestModeTarget) => void;
  clearTestMode: () => void;
}

const ScenarioTestModeContext = createContext<ScenarioTestModeContextValue | null>(null);

export const ScenarioTestModeProvider = ({ children }: { children: ReactNode }) => {
  const [activeTestMode, setActiveTestMode] = useState<ScenarioTestModeTarget | null>(null);

  const value = useMemo<ScenarioTestModeContextValue>(
    () => ({
      activeTestMode,
      isTestModeActive: (target) => activeTestMode === target,
      toggleTestMode: (target) => setActiveTestMode((current) => (current === target ? null : target)),
      clearTestMode: () => setActiveTestMode(null),
    }),
    [activeTestMode]
  );

  return <ScenarioTestModeContext.Provider value={value}>{children}</ScenarioTestModeContext.Provider>;
};

export const useScenarioTestMode = () => {
  const context = useContext(ScenarioTestModeContext);
  if (!context) {
    throw new Error('useScenarioTestMode must be used within a ScenarioTestModeProvider');
  }
  return context;
};

export const useScenarioTestModeTarget = (target: ScenarioTestModeTarget) => {
  const { isTestModeActive, toggleTestMode } = useScenarioTestMode();
  return {
    isTestMode: isTestModeActive(target),
    toggleTestMode: () => toggleTestMode(target),
  };
};
