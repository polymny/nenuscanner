import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import UpsertArtifactDialog from './-components/upsert-artifact-dialog';
import { useDeleteArtifact } from '@/api/mutations/artifact.mutations';
import { useDownloadAcquisitions } from '@/api/mutations/acquisition.mutations';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import ArtifactCard from '@/components/artifact/artifact-card';
import CreateAcquisitionCard from '@/components/acquisition/create-acquisition-card';
import SelectionHeader from '@/components/acquisition/selection-header';
import { ComponentCardSkeleton } from '@/components/component-card';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';
import { useSelection } from '@/hooks/use-selection';
import { pluralize } from '@/lib/utils';

export const Route = createFileRoute('/(app)/artifacts/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: artifacts, isPending } = useGetArtifacts();
  const showSkeleton = useMinimumLoadingDuration(isPending);
  const [upsertMode, setUpsertMode] = useState<'create' | 'update'>('create');
  const [openUpsertDialog, setOpenUpsertDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<null | number>(null);

  // Only artifacts with something to download can be selected.
  const selectableIds = useMemo(
    () => (artifacts ?? []).filter((artifact) => artifact.completedAcquisitionIds.length > 0).map(({ id }) => id),
    [artifacts]
  );
  const selection = useSelection(selectableIds);
  const selectedCount = selection.selectedIds.length;

  const { mutate: deleteArtifact } = useDeleteArtifact({
    onSuccess: () => {
      toast.success('Objet supprimé.');
    },
    onError: () => {
      toast.error('La suppression a échoué.');
    },
  });

  const { mutate: downloadAcquisitions, isPending: isDownloading } = useDownloadAcquisitions({
    onError: () => {
      toast.error('Le téléchargement a échoué.');
    },
  });

  const downloadArtifacts = (artifactIds: Array<number>) =>
    downloadAcquisitions({
      acquisitionIds: (artifacts ?? [])
        .filter((artifact) => artifactIds.includes(artifact.id))
        .flatMap((artifact) => artifact.completedAcquisitionIds),
    });

  const openUpsert = (mode: 'create' | 'update', artifactId: number | null) => {
    setUpsertMode(mode);
    setSelectedArtifactId(artifactId);
    setOpenUpsertDialog(true);
  };

  return (
    <div className="bg-gray-25 flex h-full flex-col items-start gap-6 px-20 py-8">
      <div className="flex w-full flex-col gap-4">
        <SelectionHeader
          downloading={isDownloading}
          onDownload={() => downloadArtifacts(selection.selectedIds)}
          selectedText={`${selectedCount} ${pluralize(selectedCount, 'objet')} ${pluralize(selectedCount, 'sélectionné')}`}
          selection={selection}
          title="Objets"
          total={selectableIds.length}
        />
        {showSkeleton ? (
          <div className="grid grid-cols-4 items-start gap-x-6 gap-y-8">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isPending ? null : (
          <div className="grid grid-cols-4 items-start gap-x-6 gap-y-8">
            <CreateAcquisitionCard
              description="Créer un objet"
              label="Nouvel objet"
              onClick={() => openUpsert('create', null)}
            />
            {artifacts?.map((artifact) => (
              <ArtifactCard
                artifact={artifact}
                key={artifact.id}
                onDelete={() => {
                  setSelectedArtifactId(artifact.id);
                  setOpenDeleteDialog(true);
                }}
                onDownload={
                  artifact.completedAcquisitionIds.length > 0 ? () => downloadArtifacts([artifact.id]) : undefined
                }
                onOpen={() => void navigate({ to: `/artifacts/${artifact.id}` })}
                onRename={() => openUpsert('update', artifact.id)}
                onSelect={
                  selectableIds.includes(artifact.id)
                    ? (selected) => selection.toggle(artifact.id, selected)
                    : undefined
                }
                selected={selection.selectedIds.includes(artifact.id)}
                selectionMode={selectedCount > 0}
              />
            ))}
          </div>
        )}
      </div>
      <UpsertArtifactDialog
        open={openUpsertDialog}
        setOpen={setOpenUpsertDialog}
        artifactId={selectedArtifactId ?? undefined}
        mode={upsertMode}
      />
      <ConfirmActionDialog
        confirmButtonContent="Supprimer"
        confirmButtonVariant={{ variant: 'destructive' }}
        description="Voulez-vous vraiment supprimer cet objet ? Cette action ne peut pas être annulée."
        handleConfirmAction={() => {
          if (selectedArtifactId) deleteArtifact(selectedArtifactId);
        }}
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        title="Supprimer l'objet"
      />
    </div>
  );
}
