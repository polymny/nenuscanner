import type { LedValue } from './led.types';

export interface ScenarioLed {
  value: LedValue;
  power: number;
}

export interface Scenario {
  id: number;
  name: string;
  leds: Array<ScenarioLed>;
  rotationsCount: number;
  shutterSpeeds: Array<number>;
  acquisitions: Array<{ id: number; name: string }>;
  calibrations: Array<{ id: number; name: string }>;
  updatedAt: string;
}
