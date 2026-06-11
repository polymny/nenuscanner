export const CAMERA_SETTING_NAMES = ['shutterspeed', 'iso', 'aperture'] as const;
export type CameraSettingName = (typeof CAMERA_SETTING_NAMES)[number];

/** Repère normalisé aligné sur l'API POST /camera/focus-area (cadre 16:9, zone utile 3:2 centrée). */
export const FOCUS_AREA_NORM_WIDTH = 8256;
export const FOCUS_AREA_NORM_HEIGHT = 4644;
export const FOCUS_AREA_CROP_X = (FOCUS_AREA_NORM_WIDTH - (FOCUS_AREA_NORM_HEIGHT * 3) / 2) / 2;

export interface CameraFocusAreaPayload {
  x: number;
  y: number;
}

export interface CameraSettings {
  shutterSpeedValues: Array<number>;
  currentShutterSpeedValue: number;
  apertureValues: Array<number>;
  currentApertureValue: number;
  isoValues: Array<number>;
  currentIsoValue: number;
}
