export const CAMERA_SETTING_NAMES = ['shutterspeed', 'iso', 'aperture'] as const;
export type CameraSettingName = (typeof CAMERA_SETTING_NAMES)[number];

export interface CameraSettings {
  shutterSpeedValues: Array<number>;
  currentShutterSpeedValue: number;
  apertureValues: Array<number>;
  currentApertureValue: number;
  isoValues: Array<number>;
  currentIsoValue: number;
}
