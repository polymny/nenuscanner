import { memo } from 'react';
import { Focus } from 'lucide-react';
import { toast } from 'sonner';
import CameraSettingSlider from './camera-setting-slider';
import type { CameraSettings } from '@/types/camera.types';
import { useTriggerCameraAutofocus, useUpdateCameraSetting } from '@/api/mutations/camera.mutations';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
    <div className="flex w-1/2 flex-col gap-8 p-10">
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-gray-950">Mise au point</p>
          <p className="text-xs text-gray-500">Déclencher l&apos;autofocus manuellement</p>
        </div>
        <Button
          className="shrink-0"
          disabled={isBusy}
          onClick={() => triggerAutofocus()}
          size="sm"
          type="button"
          variant="outline"
        >
          <Focus className="size-4" />
          {isAutofocusing ? 'En cours…' : 'Autofocus'}
        </Button>
      </div>

      <Separator />

      {isPending ? (
        <p className="text-sm text-gray-600">Chargement des réglages…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Impossible de charger les réglages de la caméra.</p>
      ) : (
        <>
          <CameraSettingSlider
            currentValue={settings.currentIsoValue}
            disabled={isBusy}
            label="ISO"
            onValueChange={updateSetting}
            setting="iso"
            values={settings.isoValues}
          />
          <Separator />
          <CameraSettingSlider
            currentValue={settings.currentShutterSpeedValue}
            disabled={isBusy}
            label="Temps de pose"
            onValueChange={updateSetting}
            setting="shutterspeed"
            values={settings.shutterSpeedValues}
          />
          <Separator />
          <CameraSettingSlider
            currentValue={settings.currentApertureValue}
            disabled={isBusy}
            label="Ouverture"
            onValueChange={updateSetting}
            setting="aperture"
            values={settings.apertureValues}
          />
        </>
      )}
    </div>
  );
});

export default CameraSettingsForm;
