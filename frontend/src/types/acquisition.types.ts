import type { VariantProps } from 'class-variance-authority';
import type { LedValue } from './led.types';
import type { badgeVariants } from '@/components/ui/badge';

export const ACQUISITION_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'] as const;
export type AcquisitionStatus = (typeof ACQUISITION_STATUSES)[number];

export const acquisitionStatusBadges: Record<
  AcquisitionStatus,
  { badgeVariant: VariantProps<typeof badgeVariants>; label: string }
> = {
  FAILED: { badgeVariant: { variant: 'error' }, label: 'Échoué' },
  RUNNING: { badgeVariant: { variant: 'warning' }, label: 'En cours' },
  PENDING: { badgeVariant: { variant: 'default' }, label: 'En attente' },
  COMPLETED: { badgeVariant: { variant: 'success' }, label: 'Terminée' },
};

export interface Acquisition {
  id: number;
  name: string;
  thumbnail: string | null;
  artifactId: number;
  scenarioId: number;
  calibrationId: number | null;
  armsPositionId: number;
  withRotationAutofocus: boolean;
  status: AcquisitionStatus;
  isoValue: number;
  absoluteShutterSpeedValue: number;
  apertureValue: number;
  isCalibration: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcquisitionPhoto {
  id: number;
  imageUrl: string;
  acquisitionId: number;
  rotationRadians: number | null;
  ledValue: LedValue | null;
  ledPower: number | null;
  shutterSpeedRelative: number | null;
}

export interface AcquisitionDetail extends Acquisition {
  photos: Array<AcquisitionPhoto>;
}

export interface AcquisitionRunStartResponse {
  jobId: string;
  acquisitionId: number;
}

export interface ScenarioProgressEvent {
  total: number;
  imageUrl?: string;
  step: number;
  rotationIndex: number;
  rotationTotal: number;
  hasRotations: boolean;
  rotationRadians: number | null;
  ledIndex: number;
  ledTotal: number;
  ledValue: string;
  ledPower: number;
  shutterSpeedIndex: number;
  shutterSpeedTotal: number;
  shutterSpeedRelative: number;
}
