import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LedValue } from '@/types/led.types';

export type ScenarioInspectModeTarget = 'shutter-speeds' | 'poses' | `led:${LedValue}`;

export const ledInspectModeTarget = (ledValue: LedValue): ScenarioInspectModeTarget => `led:${ledValue}`;

export const parseLedValueFromInspectModeTarget = (target: ScenarioInspectModeTarget | null): LedValue | null => {
  if (!target?.startsWith('led:')) return null;
  return target.slice('led:'.length) as LedValue;
};

interface ScenarioInspectModeContextValue {
  activeInspectMode: ScenarioInspectModeTarget | null;
  shutterSpeedPreviewValue: number | null;
  isInspectModeActive: (target: ScenarioInspectModeTarget) => boolean;
  toggleInspectMode: (target: ScenarioInspectModeTarget) => void;
  clearInspectMode: () => void;
  setShutterSpeedPreviewValue: (value: number | null) => void;
}

const ScenarioInspectModeContext = createContext<ScenarioInspectModeContextValue | null>(null);

export const ScenarioInspectModeProvider = ({ children }: { children: ReactNode }) => {
  const [activeInspectMode, setActiveInspectMode] = useState<ScenarioInspectModeTarget | null>(null);
  const [shutterSpeedPreviewValue, setShutterSpeedPreviewValue] = useState<number | null>(null);

  const value = useMemo<ScenarioInspectModeContextValue>(
    () => ({
      activeInspectMode,
      shutterSpeedPreviewValue,
      isInspectModeActive: (target) => activeInspectMode === target,
      toggleInspectMode: (target) => setActiveInspectMode((current) => (current === target ? null : target)),
      clearInspectMode: () => setActiveInspectMode(null),
      setShutterSpeedPreviewValue,
    }),
    [activeInspectMode, shutterSpeedPreviewValue]
  );

  return <ScenarioInspectModeContext.Provider value={value}>{children}</ScenarioInspectModeContext.Provider>;
};

export const useScenarioInspectMode = () => {
  const context = useContext(ScenarioInspectModeContext);
  if (!context) {
    throw new Error('useScenarioInspectMode must be used within a ScenarioInspectModeProvider');
  }
  return context;
};

export const useScenarioInspectModeTarget = (target: ScenarioInspectModeTarget) => {
  const { isInspectModeActive, toggleInspectMode } = useScenarioInspectMode();
  return {
    isInspectMode: isInspectModeActive(target),
    toggleInspectMode: () => toggleInspectMode(target),
  };
};
