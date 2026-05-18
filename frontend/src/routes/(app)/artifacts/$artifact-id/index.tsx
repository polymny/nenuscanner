import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import CreateAcquisitionDialog from '../-components/create-acquisition/create-acquisition-dialog';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';
import { Button } from '@/components/ui/button';
import { useGetAcquisitionsByArtifactId } from '@/api/queries/acquisition.queries';
import { ComponentCard, ComponentCardSkeleton } from '@/components/component-card';
import { cn } from '@/lib/utils';
import { useDeleteAcquisition } from '@/api/mutations/acquisition.mutations';
import ConfirmActionDialog from '@/components/confirm-action-dialog';

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

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAcquisitionId, setSelectedAcquisitionId] = useState<null | number>(null);

  const { mutate: deleteAcquisition } = useDeleteAcquisition({
    onSuccess: () => {
      toast.success('Acquisition supprimée.');
    },
    onError: () => {
      toast.error('La suppression a échoué.');
    },
  });

  const [openCreateAcquisitionDialog, setOpenCreateAcquisitionDialog] = useState(false);

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
          <div className="flex items-start justify-between">
            <h2 className="font-semibold text-gray-950">{`Acquisitions de ${existingArtifact.name}`}</h2>
            <Button
              className={cn(!acquisitions?.length ? 'hidden' : '')}
              onClick={() => setOpenCreateAcquisitionDialog(true)}
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
              <Button onClick={() => setOpenCreateAcquisitionDialog(true)}>Créer une acquisition</Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {acquisitions.map((acquisition) => (
                <ComponentCard
                  name={acquisition.name}
                  key={acquisition.id}
                  onDelete={() => {
                    setSelectedAcquisitionId(acquisition.id);
                    setOpenDeleteDialog(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <CreateAcquisitionDialog
        artifactId={existingArtifact.id}
        open={openCreateAcquisitionDialog}
        setOpen={setOpenCreateAcquisitionDialog}
      />
      <ConfirmActionDialog
        confirmButtonContent="Supprimer"
        confirmButtonVariant={{ variant: 'destructive' }}
        description="Voulez-vous vraiment supprimer cette acquisition ? Cette action ne peut pas être annulée."
        handleConfirmAction={() => {
          if (selectedAcquisitionId) deleteAcquisition(selectedAcquisitionId);
        }}
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        title="Supprimer l'acquisition"
      />
    </div>
  );
}
