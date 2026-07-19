import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Camera, Loader2 } from 'lucide-react';
import AcquisitionImageCard from './-components/acquisition-image-card';
import ScenarioProgressWidget from './-components/scenario-progress-widget';
import { toAbsoluteImageUrl, useGetAcquisitionById } from '@/api/queries/acquisition.queries';
import { useAcquisitionRun } from '@/hooks/use-acquisition-run';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { acquisitionStatusBadges } from '@/types/acquisition.types';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';

export const Route = createFileRoute('/(app)/acquisitions/$acquisition-id/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { 'acquisition-id': acquisitionIdParam } = Route.useParams();
  const acquisitionId = Number(acquisitionIdParam);

  const { data: acquisition, isPending, isError } = useGetAcquisitionById(acquisitionId);
  const {
    startOrResume,
    cancel,
    progress,
    lastImageUrl,
    error: runError,
    isCancelling,
  } = useAcquisitionRun(acquisitionId, acquisition?.status);

  const progressPercent = progress && progress.total > 0 ? Math.round((progress.step / progress.total) * 100) : 0;

  if (isPending) return <></>;

  if (isError) {
    navigate({ to: '/artifacts' });
    return null;
  }

  const lastImage = acquisition.images.at(-1);
  const displayImageUrl = lastImageUrl ?? (lastImage ? toAbsoluteImageUrl(lastImage.imageUrl) : null);
  const poseTotal = acquisition.scenario.posesCount;

  return (
    <div className="bg-gray-25 flex h-full flex-col gap-6 px-20 py-8">
      <CustomBreadcrumb
        backPageName={`Revenir aux ${acquisition.isCalibration ? 'étalonnages' : 'acquisitions'}`}
        backPagePath={
          acquisition.isCalibration
            ? '/calibrations'
            : acquisition.artifactId
              ? `/artifacts/${acquisition.artifactId}`
              : '/artifacts'
        }
        currentPageName={acquisition.name}
      />

      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-gray-950">{acquisition.name}</h1>
        <Badge variant={acquisitionStatusBadges[acquisition.status].badgeVariant.variant}>
          {acquisitionStatusBadges[acquisition.status].label}
        </Badge>
      </div>

      {(acquisition.status === 'PENDING' || acquisition.status === 'RUNNING' || acquisition.status === 'PAUSED') && (
        <div className="bg-brand-50 relative flex min-h-[420px] w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300">
          {acquisition.status === 'PENDING' ? (
            <div className="flex flex-col items-center gap-4 p-12">
              <div className="rounded-full border border-gray-200 bg-white p-4">
                <Camera className="text-brand-600 size-10" />
              </div>
              <p className="text-center text-gray-600">
                {acquisition.isCalibration ? 'Étalonnage prêt à être lancé' : 'Acquisition prête à être lancée'}
              </p>
              <Button onClick={() => void startOrResume()} size="lg">
                Démarrer
              </Button>
            </div>
          ) : (
            <>
              {progress && <ScenarioProgressWidget progress={progress} />}
              {acquisition.status === 'RUNNING' && (
                <div className="absolute top-4 left-4 z-10">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isCancelling}
                    onClick={() => void cancel()}
                    variant="destructive"
                  >
                    {isCancelling ? 'Annulation en cours…' : 'Annuler'}
                  </Button>
                </div>
              )}
              <div className="absolute inset-0 flex flex-col">
                {displayImageUrl ? (
                  <img
                    alt={`Photo ${progress?.step ?? 0}`}
                    className="size-full object-contain"
                    src={displayImageUrl}
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 text-gray-500">
                    <Loader2 className="size-10 animate-spin" />
                    <p>Préparation de la prochaine photo…</p>
                  </div>
                )}
                {progress && (
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-6 text-white">
                    <p className="font-medium">
                      Photo {progress.step} / {progress.total}
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/30">
                      <div
                        className="bg-brand-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {acquisition.status === 'PAUSED' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-8">
                  <div className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
                    <div className="flex flex-col gap-2 text-center">
                      <h2 className="text-lg font-semibold text-gray-950">L&apos;acquisition est en pause</h2>
                      <p className="text-sm leading-relaxed text-gray-600">
                        Changez la pose de l'objet manuellement, puis reprenez l&apos;acquisition lorsque vous êtes
                        prêt.
                      </p>
                    </div>
                    <Button onClick={() => void startOrResume()} size="lg">
                      Reprendre
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {acquisition.status === 'FAILED' && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-error-700">{runError ?? "L'acquisition a échoué."}</p>
          <Button onClick={() => void startOrResume()} variant="outline">
            Réessayer
          </Button>
        </div>
      )}

      {runError && <p className="text-error-700 text-sm">{runError}</p>}

      {acquisition.status === 'COMPLETED' && acquisition.images.length > 0 && (
        <div className="flex w-full flex-col gap-4">
          <h2 className="font-medium text-gray-900">Galerie ({acquisition.images.length} photos)</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {acquisition.images.map((image) => (
              <AcquisitionImageCard key={image.id} image={image} poseTotal={poseTotal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
