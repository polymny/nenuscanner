import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import ConfigureAcquisitionDialog from '../-components/configure-acquisition/configure-acquisition-dialog';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';
import { Button } from '@/components/ui/button';
import { useGetAcquisitionsByArtifactId } from '@/api/queries/acquisition.queries';
import { ComponentCard, ComponentCardSkeleton } from '@/components/component-card';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/(app)/artifacts/$artifact-id/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { 'artifact-id': artifactId } = Route.useParams();
  const navigate = useNavigate();
  const { data: artifacts, isPending: isLoadingArtifacts } = useGetArtifacts();
  const { data: acquisitions, isPending: isLoadingAcquisitions } = useGetAcquisitionsByArtifactId(Number(artifactId));
  const existingArtifact = useMemo(
    () => artifacts?.find((artifact) => artifact.id === Number(artifactId)),
    [artifacts, artifactId]
  );

  const [openConfigureAcquisitionDialog, setOpenConfigureAcquisitionDialog] = useState(false);

  if (!isLoadingArtifacts && !existingArtifact) {
    navigate({ to: '/artifacts' });
    return null;
  }

  if (!existingArtifact) return <></>;

  return (
    <div className="bg-gray-25 flex h-full flex-col items-start gap-6 px-20 py-8">
      <CustomBreadcrumb
        backPageName="Revenir aux objets"
        backPagePath="/artifacts"
        currentPageName={existingArtifact.name}
      />
      {isLoadingAcquisitions ? (
        <div className="grid w-full grid-cols-3 gap-5">
          <ComponentCardSkeleton />
          <ComponentCardSkeleton />
          <ComponentCardSkeleton />
          <ComponentCardSkeleton />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-950">{`Acquisitions de ${existingArtifact.name}`}</h2>
            <Button
              className={cn(!acquisitions?.length ? 'hidden' : '')}
              onClick={() => setOpenConfigureAcquisitionDialog(true)}
            >
              Créer une acquisition
            </Button>
          </div>
          {!acquisitions?.length ? (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="size-max rounded-full border border-gray-200 bg-white p-3">
                <Camera className="text-brand-600 size-6" />
              </div>
              <h4 className="font-semibold">Aucune acquisition trouvée</h4>
              <Button onClick={() => setOpenConfigureAcquisitionDialog(true)}>Créer une acquisition</Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {acquisitions.map((acquisition) => (
                <ComponentCard name={`Acquisition ${acquisition.id}`} key={acquisition.id} />
              ))}
            </div>
          )}
        </div>
      )}
      <ConfigureAcquisitionDialog open={openConfigureAcquisitionDialog} setOpen={setOpenConfigureAcquisitionDialog} />
    </div>
  );
}
