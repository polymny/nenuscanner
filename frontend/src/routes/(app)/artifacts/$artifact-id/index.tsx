import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AcquisitionsGrid from './-components/acquisitions-grid';
import CreateAcquisitionDialog from './-components/create-acquisition/create-acquisition-dialog';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';
import { Button } from '@/components/ui/button';
import { useGetAcquisitionsByArtifactId } from '@/api/queries/acquisition.queries';
import { ComponentCardSkeleton } from '@/components/component-card';
import { useDeleteAcquisition, useDownloadAcquisitions } from '@/api/mutations/acquisition.mutations';
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
  const [multiSelectedAcquisitionIds, setMultiSelectedAcquisitionIds] = useState<Array<number>>([]);

  const { mutate: deleteAcquisition } = useDeleteAcquisition({
    onSuccess: () => {
      toast.success('Acquisition supprimée.');
    },
    onError: () => {
      toast.error('La suppression a échoué.');
    },
  });

  const { mutate: downloadAcquisitions, isPending: isDownloadingAcquisitions } = useDownloadAcquisitions({
    onSuccess: () => {
      toast.success('Téléchargement des acquisitions terminé.');
    },
    onError: () => {
      toast.error('Le téléchargement a échoué.');
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

  const handleAcquisitionSelect = useCallback((acquisitionId: number, selected: boolean) => {
    setMultiSelectedAcquisitionIds((previous) =>
      selected ? [...previous, acquisitionId] : previous.filter((id) => id !== acquisitionId)
    );
  }, []);

  const handleAcquisitionDownload = useCallback(
    (acquisitionId: number) => {
      downloadAcquisitions({ acquisitionIds: [acquisitionId] });
    },
    [downloadAcquisitions]
  );

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
          {!showSkeleton && (
            <Button
              disabled={multiSelectedAcquisitionIds.length === 0 || isDownloadingAcquisitions}
              onClick={() => downloadAcquisitions({ acquisitionIds: multiSelectedAcquisitionIds })}
              variant="outline"
            >
              Télécharger les acquisitions
            </Button>
          )}
        </div>
        {showSkeleton ? (
          <div className="grid grid-cols-4 items-start gap-x-6 gap-y-8">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isLoadingAcquisitions ? null : (
          <AcquisitionsGrid
            acquisitions={acquisitions ?? []}
            createDescription="Créer une acquisition pour cet objet"
            createLabel="Nouvelle acquisition"
            onCreate={() => setOpenCreateAcquisitionDialog(true)}
            onDelete={handleAcquisitionDelete}
            onDownloadAcquisition={handleAcquisitionDownload}
            onNavigate={handleAcquisitionNavigate}
            onSelectAcquisition={handleAcquisitionSelect}
            multiSelectedAcquisitionIds={multiSelectedAcquisitionIds}
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
