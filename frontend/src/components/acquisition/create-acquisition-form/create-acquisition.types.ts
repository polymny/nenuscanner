export type AcquisitionKind = 'object' | 'calibration';

export type CreateCalibrationStep = 'name' | 'scenario';
export type CreateAcquisitionStep = CreateCalibrationStep | 'calibration';

export type CreateGlobalAcquisitionState =
  | { step: 'kind'; kind: null }
  | { step: 'artifact'; kind: 'object' }
  | { step: CreateAcquisitionStep; kind: 'object'; artifactId: number }
  | { step: CreateCalibrationStep; kind: 'calibration' };

export type CreateGlobalAcquisitionStep = CreateGlobalAcquisitionState['step'];
