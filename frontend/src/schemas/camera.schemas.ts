import vine from '@vinejs/vine';
import type { Infer } from '@vinejs/vine/types';
import { CAMERA_SETTING_NAMES } from '@/types/camera.types';

const cameraSettingName = vine.enum(CAMERA_SETTING_NAMES);

export const updateCameraSettingSchema = vine.create(
  vine.object({
    setting: cameraSettingName,
    value: vine.number(),
  })
);

export type UpdateCameraSettingPayload = Infer<typeof updateCameraSettingSchema>;
