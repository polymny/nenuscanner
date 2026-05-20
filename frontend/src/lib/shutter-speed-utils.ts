import { createLogSpacedValues } from './utils';

export const SHUTTER_SPEED_MIN = 1 / 100;
export const SHUTTER_SPEED_MAX = 100;
export const SHUTTER_SPEED_SIDES_COUNT = 10;

const belowReference = createLogSpacedValues(SHUTTER_SPEED_MIN, 1, SHUTTER_SPEED_SIDES_COUNT + 1);
const aboveReference = createLogSpacedValues(1, SHUTTER_SPEED_MAX, SHUTTER_SPEED_SIDES_COUNT + 1).slice(1);

export const SHUTTER_SPEED_VALUES = [...belowReference, ...aboveReference];

export const SHUTTER_SPEED_REFERENCE_VALUE = 1;
