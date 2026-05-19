export const ACQUISITION_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'] as const;
export type AcquisitionStatus = (typeof ACQUISITION_STATUSES)[number];

export interface Acquisition {
  id: number;
  name: string;
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
  path: string;
  imageUrl: string;
  acquisitionId: number;
  scenarioRotationId: number | null;
  scenarioShutterSpeedId: number | null;
  scenarioLedId: number | null;
}

export interface AcquisitionDetail extends Acquisition {
  photos: Array<AcquisitionPhoto>;
}

export interface AcquisitionRunStartResponse {
  jobId: string;
  acquisitionId: number;
}
