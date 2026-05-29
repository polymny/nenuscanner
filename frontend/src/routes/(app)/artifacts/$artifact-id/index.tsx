import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import AcquisitionsGrid from './-components/acquisitions-grid';
import CreateAcquisitionDialog from './-components/create-acquisition/create-acquisition-dialog';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';
import { Button } from '@/components/ui/button';
import { useGetAcquisitionsByArtifactId } from '@/api/queries/acquisition.queries';
import { ComponentCardSkeleton } from '@/components/component-card';
import { useDeleteAcquisition } from '@/api/mutations/acquisition.mutations';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';

export const Route = createFileRoute('/(app)/artifacts/$artifact-id/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { 'artifact-id': artifactId } = Route.useParams();
  const navigate = useNavigate();
  const { data: artifacts, isPending: isLoadingArtifacts } = useGetArtifacts();
  const { data: acquisitions, isPending: isLoadingAcquisitions } = useGetAcquisitionsByArtifactId(Number(artifactId));
  const showSkeleton = useMinimumLoadingDuration(isLoadingAcquisitions);
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

  const handleAcquisitionNavigate = useCallback(
    (acquisitionId: number) => {
      void navigate({ to: `/acquisitions/${acquisitionId}` });
    },
    [navigate]
  );

  const handleAcquisitionDelete = useCallback((acquisitionId: number) => {
    setSelectedAcquisitionId(acquisitionId);
    setOpenDeleteDialog(true);
  }, []);

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
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-start justify-between">
          <h2 className="font-semibold text-gray-950">{`Acquisitions de ${existingArtifact.name}`}</h2>
          {!showSkeleton && !!acquisitions?.length && (
            <Button onClick={() => setOpenCreateAcquisitionDialog(true)}>Créer une acquisition</Button>
          )}
        </div>
        {showSkeleton ? (
          <div className="grid grid-cols-3 gap-5">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isLoadingAcquisitions ? null : !acquisitions?.length ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="size-max rounded-full border border-gray-200 bg-white p-3">
              <Camera className="text-brand-600 size-6" />
            </div>
            <h4 className="font-semibold">Aucune acquisition trouvée</h4>
            <Button onClick={() => setOpenCreateAcquisitionDialog(true)}>Créer une acquisition</Button>
          </div>
        ) : (
          <AcquisitionsGrid
            acquisitions={acquisitions}
            onDelete={handleAcquisitionDelete}
            onNavigate={handleAcquisitionNavigate}
          />
        )}
      </div>
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
