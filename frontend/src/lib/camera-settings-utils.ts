import type { CameraSettingName } from '@/types/camera.types';
import { formatNumberAsFractionOrDecimal } from '@/lib/utils';

const VALUE_TOLERANCE = 1e-9;

export const findMatchingSettingValue = (values: Array<number>, current: number): number | undefined => {
  return values.find((value) => Math.abs(value - current) < VALUE_TOLERANCE);
};

export const formatCameraSettingOption = (setting: CameraSettingName, value: number): string => {
  switch (setting) {
    case 'iso':
      return String(value);
    case 'aperture':
      return `f/${value}`;
    case 'shutterspeed':
      return `${formatNumberAsFractionOrDecimal(value)} s`;
  }
};
