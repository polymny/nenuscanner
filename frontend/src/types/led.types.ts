export const LEDS_COUNT = 12;
const LEDS_NUMERIC_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
export const LED_SPECIAL_VALUES = ['ALL_LEDS', 'NO_LED'] as const;
export const LED_VALUES = [...LEDS_NUMERIC_VALUES, ...LED_SPECIAL_VALUES] as const;
export type LedValue = (typeof LED_VALUES)[number];

export const getLedValueLabel = (ledValue: LedValue) => {
  if (ledValue === 'ALL_LEDS') return 'Toutes les LEDs';
  if (ledValue === 'NO_LED') return 'Aucune LED';
  return `LED n°${ledValue}`;
};
