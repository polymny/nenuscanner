import { memo } from 'react';
import { toast } from 'sonner';
import CameraSettingSelect from './camera-setting-select';
import type { CameraSettings } from '@/types/camera.types';
import { useTriggerCameraAutofocus, useUpdateCameraSetting } from '@/api/mutations/camera.mutations';
import { Button } from '@/components/ui/button';

interface CameraSettingsFormProps {
  isPending: boolean;
  isError: boolean;
  settings: CameraSettings;
}

const CameraSettingsForm = memo(function CameraSettingsForm({ isPending, isError, settings }: CameraSettingsFormProps) {
  const { mutate: updateSetting, isPending: isUpdatingSetting } = useUpdateCameraSetting({
    onSuccess: () => {
      toast.success('Réglage appliqué.');
    },
    onError: () => {
      toast.error('Impossible de modifier ce réglage.');
    },
  });

  const { mutate: triggerAutofocus, isPending: isAutofocusing } = useTriggerCameraAutofocus({
    onSuccess: () => {
      toast.success('Autofocus déclenché.');
    },
    onError: () => {
      toast.error("Impossible de déclencher l'autofocus.");
    },
  });

  const isBusy = isUpdatingSetting || isAutofocusing;

  return (
    <div className="flex w-1/2 flex-col gap-6 p-10">
      {isPending ? (
        <p className="text-sm text-gray-600">Chargement des réglages…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Impossible de charger les réglages de la caméra.</p>
      ) : (
        <>
          <CameraSettingSelect
            currentValue={settings.currentIsoValue}
            disabled={isBusy}
            label="ISO"
            onValueChange={updateSetting}
            setting="iso"
            values={settings.isoValues}
          />
          <CameraSettingSelect
            currentValue={settings.currentShutterSpeedValue}
            disabled={isBusy}
            label="Temps de pose"
            onValueChange={updateSetting}
            setting="shutterspeed"
            values={settings.shutterSpeedValues}
          />
          <CameraSettingSelect
            currentValue={settings.currentApertureValue}
            disabled={isBusy}
            label="Ouverture"
            onValueChange={updateSetting}
            setting="aperture"
            values={settings.apertureValues}
          />
        </>
      )}

      <Button disabled={isBusy} onClick={() => triggerAutofocus()} type="button">
        {isAutofocusing ? 'Autofocus en cours…' : 'Autofocus'}
      </Button>
    </div>
  );
});

export default CameraSettingsForm;
