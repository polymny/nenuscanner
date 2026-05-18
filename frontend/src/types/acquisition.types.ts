export interface Acquisition {
  id: number;
  artifactId: number;
  scenarioId: number;
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
