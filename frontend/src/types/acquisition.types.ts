export interface Acquisition {
  id: number;
  name: string;
  artifactId: number;
  scenarioId: number;
  calibrationId: number | null;
  armsPositionId: number;
  withRotationAutofocus: boolean;
  status: string;
  isoValue: number;
  absoluteShutterSpeedValue: number;
  apertureValue: number;
  isCalibration: boolean;
  createdAt: string;
  updatedAt: string;
}
