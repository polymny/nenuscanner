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
}

