import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import CameraLivePreview from './-components/camera-live-preview';
import CameraSettingsForm from './-components/camera-settings-form';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/lib/api-types';
import { useChangeCamera } from '@/api/mutations/camera.mutations';
import { useGetCameraSettings } from '@/api/queries/camera.queries';
import InitializeCameraDialog, { isCameraNotInitialized, isNotRealCamera } from '@/components/initialize-camera-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { buildMediamtxPlayerUrl } from '@/lib/mediamtx';

export const Route = createFileRoute('/(app)/camera-settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  const playerUrl = useMemo(() => buildMediamtxPlayerUrl(), []);
  const { data, error, isPending, isError } = useGetCameraSettings();
  const { mutate: changeCamera } = useChangeCamera({
    onSuccess: () => {
      toast.success('Caméra mise à jour.');
    },
    onError: (changeError) => {
      if (isNotRealCamera(changeError)) {
        toast.error('Une caméra réelle est requise pour changer les réglages.');
        return;
      }
      toast.error('Impossible de mettre à jour la caméra.');
    },
  });
  const settings = data ?? {
    apertureValues: [],
    currentApertureValue: 0,
    currentIsoValue: 0,
    currentShutterSpeedValue: 0,
    isoValues: [],
    shutterSpeedValues: [],
  };
  const showInitializeDialog = isCameraNotInitialized(error as AxiosError<ApiError> | null);

  return (
    <div className="bg-gray-25 flex h-full w-full flex-col items-start gap-6 px-20 py-8">
      <div className="flex w-full items-center justify-between gap-6">
        <h2 className="font-semibold text-gray-950">Réglages caméra</h2>
        <Button disabled={true} onClick={() => changeCamera()} size="sm" type="button" variant="outline">
          <Camera className="size-4" />
          Changer de caméra
        </Button>
      </div>
      <div className="mt-16 flex w-full flex-1 gap-6">
        <CameraSettingsForm isPending={isPending} isError={isError && !showInitializeDialog} settings={settings} />
        <Separator orientation="vertical" />

        <div className="flex w-1/2 flex-col items-center p-10">
          <CameraLivePreview playerUrl={playerUrl} />
        </div>
      </div>
      <InitializeCameraDialog open={showInitializeDialog} />
    </div>
  );
}
