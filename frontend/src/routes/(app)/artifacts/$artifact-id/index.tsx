import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AcquisitionsGrid from './-components/acquisitions-grid';
import CreateAcquisitionDialog from './-components/create-acquisition/create-acquisition-dialog';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';
import SelectionHeader from '@/components/acquisition/selection-header';
import { useSelection } from '@/hooks/use-selection';
import { pluralize } from '@/lib/utils';
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
  const selectableIds = useMemo(
    () => (acquisitions ?? []).filter((acquisition) => acquisition.status === 'COMPLETED').map(({ id }) => id),
    [acquisitions]
  );
  const selection = useSelection(selectableIds);
  const selectedCount = selection.selectedIds.length;

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
        <SelectionHeader
          downloading={isDownloadingAcquisitions}
          onDownload={() => downloadAcquisitions({ acquisitionIds: selection.selectedIds })}
          selectedText={`${selectedCount} ${pluralize(selectedCount, 'acquisition')} ${pluralize(selectedCount, 'sélectionnée')}`}
          selection={selection}
          title={`Acquisitions de ${existingArtifact.name}`}
          total={selectableIds.length}
        />
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
            onSelectAcquisition={selection.toggle}
            multiSelectedAcquisitionIds={selection.selectedIds}
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
