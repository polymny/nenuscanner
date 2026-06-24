import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LedValue } from '@/types/led.types';

export type ScenarioTestModeTarget = 'shutter-speeds' | 'rotations' | `led:${LedValue}`;

export const ledTestModeTarget = (ledValue: LedValue): ScenarioTestModeTarget => `led:${ledValue}`;

export const parseLedValueFromTestModeTarget = (target: ScenarioTestModeTarget | null): LedValue | null => {
  if (!target?.startsWith('led:')) return null;
  return target.slice('led:'.length) as LedValue;
};

interface ScenarioTestModeContextValue {
  activeTestMode: ScenarioTestModeTarget | null;
  shutterSpeedPreviewValue: number | null;
  isTestModeActive: (target: ScenarioTestModeTarget) => boolean;
  toggleTestMode: (target: ScenarioTestModeTarget) => void;
  clearTestMode: () => void;
  setShutterSpeedPreviewValue: (value: number | null) => void;
}

const ScenarioTestModeContext = createContext<ScenarioTestModeContextValue | null>(null);

export const ScenarioTestModeProvider = ({ children }: { children: ReactNode }) => {
  const [activeTestMode, setActiveTestMode] = useState<ScenarioTestModeTarget | null>(null);
  const [shutterSpeedPreviewValue, setShutterSpeedPreviewValue] = useState<number | null>(null);

  const value = useMemo<ScenarioTestModeContextValue>(
    () => ({
      activeTestMode,
      shutterSpeedPreviewValue,
      isTestModeActive: (target) => activeTestMode === target,
      toggleTestMode: (target) => setActiveTestMode((current) => (current === target ? null : target)),
      clearTestMode: () => setActiveTestMode(null),
      setShutterSpeedPreviewValue,
    }),
    [activeTestMode, shutterSpeedPreviewValue]
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
