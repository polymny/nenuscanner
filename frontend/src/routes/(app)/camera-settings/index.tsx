import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import CameraSettingSelect from './-components/camera-setting-select';
import { useTriggerCameraAutofocus, useUpdateCameraSetting } from '@/api/mutations/camera.mutations';
import { useGetCameraSettings } from '@/api/queries/camera.queries';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/(app)/camera-settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isPending, isError } = useGetCameraSettings();
  const settings = data ?? {
    apertureValues: [],
    currentApertureValue: 0,
    currentIsoValue: 0,
    currentShutterSpeedValue: 0,
    isoValues: [],
    shutterSpeedValues: [],
  };

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
    <div className="bg-gray-25 flex h-full w-full flex-col items-start gap-6 px-20 py-8">
      <h2 className="font-semibold text-gray-950">Réglages caméra</h2>
      <div className="flex w-1/2 flex-col gap-6 border-r border-gray-200 p-10">
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
    </div>
  );
}
