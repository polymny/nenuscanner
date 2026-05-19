import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Camera, Loader2 } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import type { AcquisitionStatus } from '@/types/acquisition.types';
import type { badgeVariants } from '@/components/ui/badge';
import { Badge } from '@/components/ui/badge';
import { toAbsoluteImageUrl, useGetAcquisitionById } from '@/api/queries/acquisition.queries';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';
import { Button } from '@/components/ui/button';
import { useAcquisitionRun } from '@/hooks/use-acquisition-run';

export const Route = createFileRoute('/(app)/acquisitions/$acquisition-id/')({
  component: RouteComponent,
});

export const acquisitionStatusBadges: Record<
  AcquisitionStatus,
  { badgeVariant: VariantProps<typeof badgeVariants>; label: string }
> = {
  FAILED: { badgeVariant: { variant: 'error' }, label: 'Échoué' },
  RUNNING: { badgeVariant: { variant: 'warning' }, label: 'En cours' },
  PENDING: { badgeVariant: { variant: 'default' }, label: 'En attente' },
  COMPLETED: { badgeVariant: { variant: 'success' }, label: 'Terminée' },
};

function RouteComponent() {
  const navigate = useNavigate();
  const { 'acquisition-id': acquisitionIdParam } = Route.useParams();
  const acquisitionId = Number(acquisitionIdParam);

  const { data: acquisition, isPending, isError } = useGetAcquisitionById(acquisitionId);
  const { start, progress, lastImageUrl, error: runError } = useAcquisitionRun(acquisitionId, acquisition?.status);

  const progressPercent = progress.total > 0 ? Math.round((progress.step / progress.total) * 100) : 0;
  const photos = acquisition?.photos ?? [];
  const lastPhotoUrl = photos.length > 0 ? toAbsoluteImageUrl(photos[photos.length - 1].imageUrl) : null;
  const displayImageUrl = lastImageUrl ?? lastPhotoUrl; // useful to display a photo after refresh

  if (isPending) return <></>;

  if (isError) {
    navigate({ to: '/artifacts' });
    return null;
  }

  return (
    <div className="bg-gray-25 flex h-full flex-col gap-6 px-20 py-8">
      <CustomBreadcrumb
        backPageName="Revenir aux acquisitions"
        backPagePath={`/artifacts/${acquisition.artifactId}`}
        currentPageName={acquisition.name}
      />

      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-gray-950">{acquisition.name}</h1>
        <Badge variant={acquisitionStatusBadges[acquisition.status].badgeVariant.variant}>
          {acquisitionStatusBadges[acquisition.status].label}
        </Badge>
      </div>

      <div className="bg-brand-50 relative flex min-h-[420px] w-4xl flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300">
        {acquisition.status === 'PENDING' && (
          <div className="flex flex-col items-center gap-4 p-12">
            <div className="rounded-full border border-gray-200 bg-white p-4">
              <Camera className="text-brand-600 size-10" />
            </div>
            <p className="text-center text-gray-600">Acquisition prête à être lancée</p>
            <Button onClick={() => void start()} size="lg">
              Démarrer
            </Button>
          </div>
        )}

        {acquisition.status === 'RUNNING' && (
          <div className="absolute inset-0 flex flex-col">
            {displayImageUrl ? (
              <img alt={`Photo ${progress.step}`} className="size-full object-contain" src={displayImageUrl} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-gray-500">
                <Loader2 className="size-10 animate-spin" />
                <p>Préparation de la première photo…</p>
              </div>
            )}
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
          </div>
        )}

        {acquisition.status === 'COMPLETED' && lastPhotoUrl && (
          <div className="absolute inset-0">
            <img alt="Dernière photo" className="size-full object-contain" src={lastPhotoUrl} />
          </div>
        )}

        {acquisition.status === 'FAILED' && (
          <div className="flex flex-col items-center gap-4 p-12 text-center">
            <p className="text-error-700">{runError ?? "L'acquisition a échoué."}</p>
            <Button onClick={() => void start()} variant="outline">
              Réessayer
            </Button>
          </div>
        )}
      </div>

      {runError && <p className="text-error-700 text-sm">{runError}</p>}

      {acquisition.status === 'COMPLETED' && photos.length > 0 && (
        <section className="flex max-w-4xl flex-col gap-4">
          <h3 className="font-medium text-gray-900">Galerie ({photos.length} photos)</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {photos.map((photo, index) => (
              <figure className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" key={photo.id}>
                <img
                  alt={`Photo ${index + 1}`}
                  className="aspect-square w-full object-cover"
                  src={toAbsoluteImageUrl(photo.imageUrl)}
                />
                <figcaption className="px-2 py-1 text-center text-xs text-gray-500">{index + 1}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
