import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Amphora } from 'lucide-react';
import { toast } from 'sonner';
import UpsertArtifactDialog from './-components/upsert-artifact-dialog';
import { useDeleteArtifact } from '@/api/mutations/artifact.mutations';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import { ComponentCard, ComponentCardSkeleton } from '@/components/component-card';
import { Button } from '@/components/ui/button';
import ConfirmActionDialog from '@/components/confirm-action-dialog';

export const Route = createFileRoute('/(app)/artifacts/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: artifacts, isLoading } = useGetArtifacts();
  const [upsertMode, setUpsertMode] = useState<'create' | 'update'>('create');
  const [openUpsertDialog, setOpenUpsertDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<null | number>(null);

  const { mutate: deleteArtifact } = useDeleteArtifact({
    onSuccess: () => {
      toast.success('Objet supprimé.');
    },
    onError: () => {
      toast.error('La suppression a échoué.');
    },
  });

  return (
    <div className="bg-gray-25 flex h-full flex-col items-center gap-6 px-20 py-8">
      <div className="flex w-full items-center gap-4"></div>
      {isLoading ? (
        <div className="grid w-full grid-cols-3 gap-5">
          <ComponentCardSkeleton />
          <ComponentCardSkeleton />
          <ComponentCardSkeleton />
          <ComponentCardSkeleton />
        </div>
      ) : !artifacts?.length ? (
        <div className="flex h-full justify-center">
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="size-max rounded-full border border-gray-200 bg-white p-3">
              <Amphora className="text-brand-600 size-6" />
            </div>
            <h4 className="font-semibold">Aucun objet trouvé</h4>
            <Button
              onClick={() => {
                setUpsertMode('create');
                setSelectedArtifactId(null);
                setOpenUpsertDialog(true);
              }}
            >
              Créer un objet
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-950">Objets</h2>
            <Button
              onClick={() => {
                setUpsertMode('create');
                setSelectedArtifactId(null);
                setOpenUpsertDialog(true);
              }}
            >
              Créer un objet
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {artifacts.map((artifact) => (
              <ComponentCard
                name={artifact.name}
                key={artifact.id}
                onDelete={() => {
                  setSelectedArtifactId(artifact.id);
                  setOpenDeleteDialog(true);
                }}
                onUpdate={() => {
                  setSelectedArtifactId(artifact.id);
                  setUpsertMode('update');
                  setOpenUpsertDialog(true);
                }}
              />
            ))}
          </div>
        </div>
      )}
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
