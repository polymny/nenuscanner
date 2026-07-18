import type { AcquisitionStatus } from './acquisition.types';
import type { LedValue } from './led.types';

export interface ScenarioLed {
  value: LedValue;
  powerId: number;
}

export interface ScenarioSummary {
  id: number;
  name: string;
  leds: Array<ScenarioLed>;
  posesCount: number;
  shutterSpeedIds: Array<number>;
}

export interface Scenario extends ScenarioSummary {
  acquisitions: Array<{ id: number; name: string }>;
  calibrations: Array<{ id: number; name: string; rigConfigurationId: number; status: AcquisitionStatus }>;
  updatedAt: string;
}

export interface ScenarioCompatibility {
  id: number;
  sameLedPowerValues: boolean;
  sameShutterSpeeds: boolean;
  samePosesCount: boolean;
}
