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
  rotationsCount: number;
  shutterSpeedIds: Array<number>;
}

export interface Scenario extends ScenarioSummary {
  acquisitions: Array<{ id: number; name: string }>;
  calibrations: Array<{ id: number; name: string; armsPositionId: number; status: AcquisitionStatus }>;
  updatedAt: string;
}
