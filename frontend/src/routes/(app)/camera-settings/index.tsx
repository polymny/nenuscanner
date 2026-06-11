import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import CameraLivePreview from './-components/camera-live-preview';
import CameraSettingsForm from './-components/camera-settings-form';
import { useGetCameraSettings } from '@/api/queries/camera.queries';
import { Separator } from '@/components/ui/separator';
import { buildMediamtxPlayerUrl } from '@/lib/mediamtx';

export const Route = createFileRoute('/(app)/camera-settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  const playerUrl = useMemo(() => buildMediamtxPlayerUrl(), []);
  const { data, isPending, isError } = useGetCameraSettings();
  const settings = data ?? {
    apertureValues: [],
    currentApertureValue: 0,
    currentIsoValue: 0,
    currentShutterSpeedValue: 0,
    isoValues: [],
    shutterSpeedValues: [],
  };

  return (
    <div className="bg-gray-25 flex h-full w-full flex-col items-start gap-6 px-20 py-8">
      <h2 className="font-semibold text-gray-950">Réglages caméra</h2>
      <div className="mt-16 flex w-full flex-1 gap-6">
        <CameraSettingsForm isPending={isPending} isError={isError} settings={settings} />
        <Separator orientation="vertical" />

        <div className="flex w-1/2 flex-col items-center p-10">
          <CameraLivePreview playerUrl={playerUrl} />
        </div>
      </div>
    </div>
  );
}
