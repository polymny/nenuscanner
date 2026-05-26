import { createFileRoute } from '@tanstack/react-router';
import CameraSettingsForm from './-components/camera-settings-form';
import { useGetCameraSettings } from '@/api/queries/camera.queries';
import { useCameraPreview } from '@/hooks/use-camera-preview';
import { Separator } from '@/components/ui/separator';

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

  const { imageUrl, imageVersion, isPreparingPreview, error: previewError } = useCameraPreview();

  return (
    <div className="bg-gray-25 flex h-full w-full flex-col items-start gap-6 px-20 py-8">
      <h2 className="font-semibold text-gray-950">Réglages caméra</h2>
      <div className="flex w-full flex-1 gap-6">
        <CameraSettingsForm isPending={isPending} isError={isError} settings={settings} />
        <Separator orientation="vertical" />

        <div className="flex w-1/2 flex-col items-center justify-center gap-4 p-10">
          {previewError ? (
            <p className="text-sm text-red-600">{previewError}</p>
          ) : isPreparingPreview ? (
            <p className="text-sm text-gray-600">Préparation de la prévisualisation…</p>
          ) : imageUrl ? (
            <img
              alt="Prévisualisation caméra"
              className="max-h-full max-w-full object-contain"
              src={`${imageUrl}?v=${imageVersion}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
